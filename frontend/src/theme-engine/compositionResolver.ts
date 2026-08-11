import type {
  Composition,
  OverrideAssignment,
  OverrideValue,
  PresentationTarget,
  VersionedRef,
} from "./types";
import { compareVersions, satisfiesVersionRange } from "./version";

export interface ResolutionContext {
  instanceId?: string;
  roomId?: string;
  environmentId: string;
}

export interface BaselineAssignment {
  assignmentId: string;
  target: PresentationTarget;
  value: OverrideValue;
  priority?: number;
}

export type ResolutionSource =
  | "instance"
  | "room"
  | "environment"
  | "composition-global"
  | "active-theme"
  | "core-default";

export interface ResolutionTraceEntry {
  assignmentId: string;
  source: ResolutionSource | "unsupported";
  accepted: boolean;
  reason:
    | "winner"
    | "lower-priority"
    | "disabled"
    | "scope-mismatch"
    | "target-mismatch"
    | "unsupported-scope"
    | "value-rejected";
  rank: number;
  compositionId?: string;
}

export interface ResolutionResult {
  value: OverrideValue;
  assignmentId: string;
  source: ResolutionSource;
  trace: readonly ResolutionTraceEntry[];
}

export class CompositionResolverError extends Error {
  constructor(
    readonly code:
      | "resolve_composition_unknown"
      | "resolve_version_unsatisfied"
      | "resolve_dependency_cycle"
      | "resolve_no_candidate",
    message: string,
  ) {
    super(message);
    this.name = "CompositionResolverError";
  }
}

interface Candidate {
  assignmentId: string;
  target: PresentationTarget;
  value: OverrideValue;
  priority: number;
  source: ResolutionSource;
  rank: number;
  enabled: boolean;
  scopeMatches: boolean;
  compositionId?: string;
  compositionDepth: number;
}

const sourceRank: Readonly<Record<ResolutionSource, number>> = {
  instance: 5,
  room: 4,
  environment: 3,
  "composition-global": 2,
  "active-theme": 1,
  "core-default": 0,
};

export class CompositionResolver {
  private readonly compositions = new Map<string, Map<string, Composition>>();

  constructor(
    compositions: readonly Composition[],
    private readonly activeTheme: readonly BaselineAssignment[],
    private readonly coreDefault: readonly BaselineAssignment[],
  ) {
    for (const composition of compositions) {
      const versions = this.compositions.get(composition.compositionId) ?? new Map();
      if (versions.has(composition.version)) {
        throw new CompositionResolverError(
          "resolve_dependency_cycle",
          `Duplicate Composition ${composition.compositionId}@${composition.version}.`,
        );
      }
      versions.set(composition.version, composition);
      this.compositions.set(composition.compositionId, versions);
    }
  }

  resolve(
    compositionRef: VersionedRef,
    target: PresentationTarget,
    context: ResolutionContext,
    acceptValue: (value: OverrideValue) => boolean = () => true,
  ): ResolutionResult {
    const root = this.resolveCompositionRef(compositionRef);
    const closure = this.buildCompositionClosure(root);
    const candidates: Candidate[] = [];
    const trace: ResolutionTraceEntry[] = [];

    for (const { composition, depth } of closure) {
      for (const assignment of composition.overrides) {
        if (!targetMatches(assignment.target, target)) {
          trace.push(traceEntry(assignment, "unsupported", false, "target-mismatch", -1, composition));
          continue;
        }

        const source = sourceForAssignment(assignment);
        if (!source) {
          trace.push(
            traceEntry(assignment, "unsupported", false, "unsupported-scope", -1, composition),
          );
          continue;
        }
        const scopeMatches = assignmentScopeMatches(assignment, context);
        candidates.push({
          assignmentId: assignment.assignmentId,
          target: assignment.target,
          value: assignment.value,
          priority: assignment.priority,
          source,
          rank: sourceRank[source],
          enabled: assignment.enabled,
          scopeMatches,
          compositionId: composition.compositionId,
          compositionDepth: depth,
        });
      }
    }

    candidates.push(
      ...this.activeTheme.map((assignment) =>
        baselineCandidate(assignment, "active-theme", sourceRank["active-theme"]),
      ),
      ...this.coreDefault.map((assignment) =>
        baselineCandidate(assignment, "core-default", sourceRank["core-default"]),
      ),
    );

    const matching = candidates
      .filter((candidate) => {
        if (!targetMatches(candidate.target, target)) {
          trace.push(candidateTrace(candidate, false, "target-mismatch"));
          return false;
        }
        if (!candidate.enabled) {
          trace.push(candidateTrace(candidate, false, "disabled"));
          return false;
        }
        if (!candidate.scopeMatches) {
          trace.push(candidateTrace(candidate, false, "scope-mismatch"));
          return false;
        }
        if (!acceptValue(candidate.value)) {
          trace.push(candidateTrace(candidate, false, "value-rejected"));
          return false;
        }
        return true;
      })
      .sort(compareCandidates);

    const winner = matching[0];
    if (!winner) {
      throw new CompositionResolverError(
        "resolve_no_candidate",
        `No presentation candidate resolved for ${formatTarget(target)}.`,
      );
    }

    for (const candidate of matching) {
      trace.push(
        candidateTrace(
          candidate,
          candidate === winner,
          candidate === winner ? "winner" : "lower-priority",
        ),
      );
    }

    return {
      value: winner.value,
      assignmentId: winner.assignmentId,
      source: winner.source,
      trace: Object.freeze(trace),
    };
  }

  private buildCompositionClosure(
    root: Composition,
  ): readonly { composition: Composition; depth: number }[] {
    const result: { composition: Composition; depth: number }[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (composition: Composition, depth: number, path: readonly string[]): void => {
      const identity = `${composition.compositionId}@${composition.version}`;
      if (visiting.has(identity)) {
        throw new CompositionResolverError(
          "resolve_dependency_cycle",
          `Composition dependency cycle: ${[...path, identity].join(" -> ")}.`,
        );
      }
      if (visited.has(identity)) return;
      visiting.add(identity);
      result.push({ composition, depth });

      const parents = composition.parentCompositionRefs
        .map((reference) => this.resolveCompositionRef(reference))
        .sort(
          (left, right) =>
            left.compositionId.localeCompare(right.compositionId) ||
            compareVersions(left.version, right.version),
        );
      for (const parent of parents) visit(parent, depth + 1, [...path, identity]);

      visiting.delete(identity);
      visited.add(identity);
    };

    visit(root, 0, []);
    return result;
  }

  private resolveCompositionRef(reference: VersionedRef): Composition {
    const versions = this.compositions.get(reference.id);
    if (!versions) {
      throw new CompositionResolverError(
        "resolve_composition_unknown",
        `Composition ${reference.id} is not available.`,
      );
    }
    const compatible = [...versions.values()]
      .filter((composition) =>
        satisfiesVersionRange(composition.version, reference.versionRange),
      )
      .sort((left, right) => compareVersions(right.version, left.version));
    const resolved = compatible[0];
    if (!resolved) {
      throw new CompositionResolverError(
        "resolve_version_unsatisfied",
        `No version of ${reference.id} satisfies ${reference.versionRange}.`,
      );
    }
    return resolved;
  }
}

function sourceForAssignment(assignment: OverrideAssignment): ResolutionSource | null {
  switch (assignment.scope.level) {
    case "instance":
    case "room":
    case "environment":
    case "composition-global":
      return assignment.scope.level;
    case "rule":
    case "cluster":
    case "project":
      return null;
  }
}

function assignmentScopeMatches(
  assignment: OverrideAssignment,
  context: ResolutionContext,
): boolean {
  switch (assignment.scope.level) {
    case "instance":
      return assignment.scope.objectId === context.instanceId;
    case "room":
      return assignment.scope.scopeId === context.roomId;
    case "environment":
      return assignment.scope.scopeId === context.environmentId;
    case "composition-global":
      return true;
    case "rule":
    case "cluster":
    case "project":
      return false;
  }
}

function baselineCandidate(
  assignment: BaselineAssignment,
  source: "active-theme" | "core-default",
  rank: number,
): Candidate {
  return {
    assignmentId: assignment.assignmentId,
    target: assignment.target,
    value: assignment.value,
    priority: assignment.priority ?? 0,
    source,
    rank,
    enabled: true,
    scopeMatches: true,
    compositionDepth: Number.MAX_SAFE_INTEGER,
  };
}

function compareCandidates(left: Candidate, right: Candidate): number {
  return (
    right.rank - left.rank ||
    left.compositionDepth - right.compositionDepth ||
    right.priority - left.priority ||
    left.assignmentId.localeCompare(right.assignmentId)
  );
}

function targetMatches(candidate: PresentationTarget, requested: PresentationTarget): boolean {
  if (candidate.presentationGroup !== requested.presentationGroup) return false;
  for (const key of ["role", "slotId", "channelId", "tokenId"] as const) {
    if (candidate[key] !== undefined && candidate[key] !== requested[key]) return false;
  }
  return true;
}

function traceEntry(
  assignment: OverrideAssignment,
  source: ResolutionTraceEntry["source"],
  accepted: boolean,
  reason: ResolutionTraceEntry["reason"],
  rank: number,
  composition: Composition,
): ResolutionTraceEntry {
  return {
    assignmentId: assignment.assignmentId,
    source,
    accepted,
    reason,
    rank,
    compositionId: composition.compositionId,
  };
}

function candidateTrace(
  candidate: Candidate,
  accepted: boolean,
  reason: ResolutionTraceEntry["reason"],
): ResolutionTraceEntry {
  return {
    assignmentId: candidate.assignmentId,
    source: candidate.source,
    accepted,
    reason,
    rank: candidate.rank,
    ...(candidate.compositionId ? { compositionId: candidate.compositionId } : {}),
  };
}

function formatTarget(target: PresentationTarget): string {
  return [
    target.presentationGroup,
    target.role,
    target.slotId,
    target.channelId,
    target.tokenId,
  ]
    .filter(Boolean)
    .join("/");
}
