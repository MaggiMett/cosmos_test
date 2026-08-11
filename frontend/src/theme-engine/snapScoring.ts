import type {
  SnapCandidate,
  SnapResult,
  SnapTraceCandidate,
} from "./roomCompositionTypes";

export interface SnapEvaluationOptions {
  previousTargetId?: string;
  hysteresis?: number;
}

export function evaluateSnapCandidates(
  candidates: readonly SnapCandidate[],
  options: SnapEvaluationOptions = {},
): SnapResult {
  const evaluated = candidates.map((candidate) => {
    const rejectedBy = candidate.rules
      .filter((rule) => !rule.passed)
      .map((rule) => rule.ruleId)
      .sort(compareText);
    const valid = rejectedBy.length === 0;
    const hysteresisApplied =
      candidate.target.targetId === options.previousTargetId
        ? Math.max(0, options.hysteresis ?? 0)
        : 0;
    const score = [
      valid ? 1 : 0,
      candidate.explicitAnchorMatch ? 1 : 0,
      finite(candidate.contactQuality),
      candidate.profilePriority,
      -finite(candidate.distance),
      finite(candidate.alignmentQuality),
      finite(candidate.clearance),
      hysteresisApplied,
      candidate.target.priority,
    ] as const;
    return { candidate, rejectedBy, valid, hysteresisApplied, score };
  });

  evaluated.sort((left, right) => {
    for (let index = 0; index < left.score.length; index += 1) {
      const difference = right.score[index]! - left.score[index]!;
      if (difference !== 0) return difference;
    }
    return compareText(left.candidate.target.targetId, right.candidate.target.targetId) ||
      compareText(left.candidate.candidateId, right.candidate.candidateId);
  });

  const winner = evaluated.find((entry) => entry.valid)?.candidate;
  const traceCandidates: SnapTraceCandidate[] = evaluated.map((entry) => ({
    candidateId: entry.candidate.candidateId,
    valid: entry.valid,
    rejectedBy: entry.rejectedBy,
    score: entry.score,
    hysteresisApplied: entry.hysteresisApplied,
    selected: entry.candidate.candidateId === winner?.candidateId,
  }));

  return {
    ...(winner ? { winner } : {}),
    trace: {
      candidates: traceCandidates,
      ...(winner ? { winnerCandidateId: winner.candidateId } : {}),
      winnerReason: winner
        ? "Highest deterministic valid candidate by anchor, contact, priority, distance, alignment, clearance, hysteresis and stable ID"
        : "No candidate satisfied every hard rule",
    },
  };
}

function finite(value: number): number {
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
