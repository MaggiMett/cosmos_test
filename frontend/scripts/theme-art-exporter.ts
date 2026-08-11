import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { deflateSync } from "node:zlib";

import {
  BASE_FUNCTIONAL_ZONE_IDS,
  BASE_MAIN_ROOM_TEMPLATE_ID,
  BASE_SLOT_IDS,
} from "../src/theme-engine/baseTemplate";
import type {
  BoundsShape,
  Composition,
  EnvironmentScene,
  EnvironmentTemplate,
  FunctionalObjectScenePayload,
  RuntimeFunctionBinding,
  SceneNode,
} from "../src/theme-engine/types";
import {
  validateComposition,
  validateEnvironmentTemplate,
} from "../src/theme-engine/validation";

export const ART_PACK_EXPORTER_ID = "cosmos.environment-art-pack-exporter";
export const ART_PACK_EXPORTER_VERSION = "1.0.0";

export const BASE_ART_PACK_FILES = [
  "base-template-clean.svg",
  "base-template-clean.png",
  "base-template-zones.png",
  "base-template-hitboxes.png",
  "base-template-safe-areas.png",
  "base-template-depth.png",
  "base-template-spec.json",
  "base-template-brief.md",
  "artist/base-template-artist.png",
  "artist/base-template-outline.svg",
  "artist/base-template-mask.png",
  "artist/prompt.md",
] as const;

const REQUIRED_SLOT_IDS = Object.values(BASE_SLOT_IDS);
const REQUIRED_ZONE_IDS = Object.values(BASE_FUNCTIONAL_ZONE_IDS);

export interface ArtPackFormatOptions {
  readonly includeTechnicalLabels?: boolean;
  readonly pngCompressionLevel?: number;
}

export interface ExportArtPackInput {
  readonly template: unknown;
  readonly composition: unknown;
  readonly functionBindings: readonly RuntimeFunctionBinding[];
  readonly outputDirectory: string;
  readonly formatOptions?: ArtPackFormatOptions;
}

export type ExportEnvironmentArtPackInput = ExportArtPackInput;

export type ArtPackTemplateFamily =
  | "base"
  | "room"
  | "workspace"
  | "project-node"
  | "cluster-node"
  | "object-node"
  | "connection"
  | "companion"
  | "window";

export interface ArtPackTemplateAdapter {
  readonly adapterId: string;
  readonly implementedFamily: ArtPackTemplateFamily;
  readonly templateKinds: readonly ("environment" | "object")[];
  supports(template: unknown): boolean;
  export(input: ExportArtPackInput): Promise<ArtPackExportResult>;
}

export const ART_PACK_TEMPLATE_FAMILIES: readonly ArtPackTemplateFamily[] = [
  "base",
  "room",
  "workspace",
  "project-node",
  "cluster-node",
  "object-node",
  "connection",
  "companion",
  "window",
];

export interface ArtPackExportResult {
  readonly outputDirectory: string;
  readonly files: readonly string[];
  readonly templateId: string;
  readonly templateVersion: string;
  readonly fingerprint: string;
}

export type ArtPackExportErrorCode =
  | "invalid_template"
  | "invalid_composition"
  | "missing_slot"
  | "missing_surface_bounds"
  | "missing_scene"
  | "missing_functional_object"
  | "missing_bounds"
  | "missing_anchor"
  | "missing_binding"
  | "unsafe_output"
  | "invalid_format_option"
  | "unsupported_template";

export class EnvironmentArtPackExportError extends Error {
  constructor(
    readonly code: ArtPackExportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "EnvironmentArtPackExportError";
  }
}

interface NormalizedFunctionalObject {
  readonly node: SceneNode;
  readonly payload: FunctionalObjectScenePayload;
  readonly binding: RuntimeFunctionBinding;
}

interface NormalizedExport {
  readonly template: EnvironmentTemplate;
  readonly composition: Composition;
  readonly scene: EnvironmentScene;
  readonly functionalObjects: readonly NormalizedFunctionalObject[];
  readonly fingerprint: string;
}

interface Palette {
  readonly canvas: string;
  readonly ink: string;
  readonly muted: string;
  readonly visual: string;
  readonly interaction: string;
  readonly layout: string;
  readonly effect: string;
  readonly label: string;
  readonly anchor: string;
  readonly safe: string;
  readonly critical: string;
}

const PALETTE: Palette = {
  canvas: "#f7f7f4",
  ink: "#252525",
  muted: "#9ca3af",
  visual: "#2563eb",
  interaction: "#dc2626",
  layout: "#d97706",
  effect: "#7c3aed",
  label: "#15803d",
  anchor: "#111827",
  safe: "#0891b2",
  critical: "#e11d48",
};

type Primitive =
  | {
      readonly kind: "shape";
      readonly id: string;
      readonly shape: BoundsShape;
      readonly fill?: string;
      readonly stroke?: string;
      readonly strokeWidth?: number;
      readonly dash?: string;
      readonly opacity?: number;
      readonly data?: Readonly<Record<string, string>>;
    }
  | {
      readonly kind: "line";
      readonly id: string;
      readonly x1: number;
      readonly y1: number;
      readonly x2: number;
      readonly y2: number;
      readonly stroke: string;
      readonly strokeWidth: number;
    }
  | {
      readonly kind: "text";
      readonly id: string;
      readonly x: number;
      readonly y: number;
      readonly text: string;
      readonly fill: string;
      readonly size: number;
      readonly background?: string;
    };

interface VectorDocument {
  readonly width: number;
  readonly height: number;
  readonly title: string;
  readonly background?: string | null;
  readonly primitives: readonly Primitive[];
}

const baseMainRoomAdapter: ArtPackTemplateAdapter = {
  adapterId: "cosmos.art-pack-adapter.base-main-room-v1",
  implementedFamily: "base",
  templateKinds: ["environment"],
  supports(template: unknown): boolean {
    return isRecord(template)
      && template.templateKind === "environment"
      && template.templateId === BASE_MAIN_ROOM_TEMPLATE_ID;
  },
  export: exportBaseMainRoomArtPack,
};

export const ART_PACK_TEMPLATE_ADAPTERS: readonly ArtPackTemplateAdapter[] = [
  baseMainRoomAdapter,
];

export async function exportArtPack(
  input: ExportArtPackInput,
): Promise<ArtPackExportResult> {
  const adapter = ART_PACK_TEMPLATE_ADAPTERS.find((candidate) =>
    candidate.supports(input.template)
  );
  if (!adapter) {
    const descriptor = isRecord(input.template)
      ? `${String(input.template.templateKind ?? "unknown")}:${String(input.template.templateId ?? "unknown")}`
      : typeof input.template;
    throw new EnvironmentArtPackExportError(
      "unsupported_template",
      `No Art Pack adapter is registered for '${descriptor}'.`,
    );
  }
  return adapter.export(input);
}

export async function exportEnvironmentArtPack(
  input: ExportEnvironmentArtPackInput,
): Promise<ArtPackExportResult> {
  return exportArtPack(input);
}

async function exportBaseMainRoomArtPack(
  input: ExportEnvironmentArtPackInput,
): Promise<ArtPackExportResult> {
  const normalized = normalizeInput(input);
  const outputDirectory = validateOutputDirectory(input.outputDirectory);
  const compressionLevel = input.formatOptions?.pngCompressionLevel ?? 9;
  if (!Number.isInteger(compressionLevel) || compressionLevel < 0 || compressionLevel > 9) {
    throw new EnvironmentArtPackExportError(
      "invalid_format_option",
      "pngCompressionLevel must be an integer between 0 and 9.",
    );
  }

  const clean = buildCleanDocument(normalized, input.formatOptions?.includeTechnicalLabels ?? false);
  const zones = buildZonesDocument(normalized);
  const hitboxes = buildHitboxDocument(normalized);
  const safeAreas = buildSafeAreaDocument(normalized);
  const depth = buildDepthDocument(normalized);
  const spec = buildExportSpec(normalized);
  const brief = buildArtistBrief(normalized);
  const artist = buildArtistDocument(normalized);
  const outline = serializeArtistOutline(normalized);
  const mask = buildMaskDocument(normalized);
  const prompt = buildCreativePrompt(normalized);

  const files = new Map<string, string | Buffer>([
    ["base-template-clean.svg", serializeSvg(clean)],
    ["base-template-clean.png", renderPng(clean, compressionLevel)],
    ["base-template-zones.png", renderPng(zones, compressionLevel)],
    ["base-template-hitboxes.png", renderPng(hitboxes, compressionLevel)],
    ["base-template-safe-areas.png", renderPng(safeAreas, compressionLevel)],
    ["base-template-depth.png", renderPng(depth, compressionLevel)],
    ["base-template-spec.json", stableStringify(spec)],
    ["base-template-brief.md", brief],
    ["artist/base-template-artist.png", renderPng(artist, compressionLevel)],
    ["artist/base-template-outline.svg", outline],
    ["artist/base-template-mask.png", renderPng(mask, compressionLevel)],
    ["artist/prompt.md", prompt],
  ]);

  await mkdir(outputDirectory, { recursive: true });
  for (const fileName of BASE_ART_PACK_FILES) {
    const destination = containedFilePath(outputDirectory, fileName);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, files.get(fileName)!);
  }

  return {
    outputDirectory,
    files: BASE_ART_PACK_FILES.map((fileName) => containedFilePath(outputDirectory, fileName)),
    templateId: normalized.template.templateId,
    templateVersion: normalized.template.version,
    fingerprint: normalized.fingerprint,
  };
}

function normalizeInput(input: ExportEnvironmentArtPackInput): NormalizedExport {
  let template: EnvironmentTemplate;
  let composition: Composition;
  try {
    template = validateEnvironmentTemplate(input.template);
  } catch (error) {
    throw new EnvironmentArtPackExportError(
      "invalid_template",
      `Environment template validation failed: ${messageOf(error)}`,
    );
  }
  try {
    composition = validateComposition(input.composition);
  } catch (error) {
    throw new EnvironmentArtPackExportError(
      "invalid_composition",
      `Composition validation failed: ${messageOf(error)}`,
    );
  }

  if (template.templateId !== BASE_MAIN_ROOM_TEMPLATE_ID) {
    throw new EnvironmentArtPackExportError(
      "invalid_template",
      `Expected template '${BASE_MAIN_ROOM_TEMPLATE_ID}', received '${template.templateId}'.`,
    );
  }

  const slotIds = new Set((template.assetSlots ?? []).map((slot) => slot.slotId));
  for (const slotId of REQUIRED_SLOT_IDS) {
    if (!slotIds.has(slotId)) {
      throw new EnvironmentArtPackExportError(
        "missing_slot",
        `Required Base slot '${slotId}' is missing.`,
      );
    }
  }
  for (const surface of template.surfaces) {
    if (!surface.shape) {
      throw new EnvironmentArtPackExportError(
        "missing_surface_bounds",
        `Surface '${surface.surfaceId}' has no technical shape.`,
      );
    }
  }

  const scene = composition.environmentScenes.find(
    (candidate) => candidate.environmentTemplateRef.id === template.templateId,
  );
  if (!scene) {
    throw new EnvironmentArtPackExportError(
      "missing_scene",
      `Composition '${composition.compositionId}' has no scene for '${template.templateId}'.`,
    );
  }

  const anchors = new Set(template.anchors.map((anchor) => anchor.anchorId));
  const bindingsByZone = new Map(input.functionBindings.map((binding) => [
    binding.functionalZoneId,
    binding,
  ]));
  const nodesByZone = new Map<string, SceneNode>();
  for (const node of scene.nodes) {
    if (node.kind === "functional-object" && node.payload.kind === "functional-object") {
      if (nodesByZone.has(node.payload.functionalZoneId)) {
        throw new EnvironmentArtPackExportError(
          "missing_functional_object",
          `Functional zone '${node.payload.functionalZoneId}' has multiple scene nodes.`,
        );
      }
      nodesByZone.set(node.payload.functionalZoneId, node);
    }
  }

  const functionalObjects = REQUIRED_ZONE_IDS.map((zoneId): NormalizedFunctionalObject => {
    const node = nodesByZone.get(zoneId);
    if (!node || node.payload.kind !== "functional-object") {
      throw new EnvironmentArtPackExportError(
        "missing_functional_object",
        `Functional zone '${zoneId}' has no scene node.`,
      );
    }
    const payload = node.payload;
    for (const [role, bounds] of [
      ["visual", payload.visualBounds],
      ["interaction", payload.interactionBounds],
      ["layout", payload.layoutBounds],
      ["effect", payload.effectBounds],
    ] as const) {
      if (!bounds) {
        throw new EnvironmentArtPackExportError(
          "missing_bounds",
          `Functional zone '${zoneId}' has no ${role} bounds.`,
        );
      }
    }
    const zone = template.functionalZones.find((candidate) => candidate.zoneId === zoneId);
    if (zone?.labelAnchorId && !payload.labelBounds) {
      throw new EnvironmentArtPackExportError(
        "missing_bounds",
        `Functional zone '${zoneId}' requires label bounds.`,
      );
    }
    for (const anchorId of payload.anchorIds) {
      if (!anchors.has(anchorId)) {
        throw new EnvironmentArtPackExportError(
          "missing_anchor",
          `Scene node '${node.nodeId}' references missing anchor '${anchorId}'.`,
        );
      }
    }
    const binding = bindingsByZone.get(zoneId);
    if (!binding || binding.descriptorRole !== payload.descriptorBinding.descriptorRole) {
      throw new EnvironmentArtPackExportError(
        "missing_binding",
        `Functional zone '${zoneId}' has no stable compatible function binding.`,
      );
    }
    return { node, payload, binding };
  });

  const fingerprint = createHash("sha256")
    .update(stableStringify({ template, composition, functionBindings: input.functionBindings }))
    .digest("hex");
  return { template, composition, scene, functionalObjects, fingerprint };
}

function validateOutputDirectory(outputDirectory: string): string {
  if (typeof outputDirectory !== "string" || outputDirectory.trim() === "") {
    throw new EnvironmentArtPackExportError(
      "unsafe_output",
      "outputDirectory must be a non-empty filesystem path.",
    );
  }
  if (outputDirectory.includes("\0")) {
    throw new EnvironmentArtPackExportError("unsafe_output", "outputDirectory contains a NUL byte.");
  }
  return path.resolve(outputDirectory);
}

function containedFilePath(outputDirectory: string, fileName: string): string {
  const destination = path.resolve(outputDirectory, fileName);
  const relative = path.relative(outputDirectory, destination);
  if (relative === "" || relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new EnvironmentArtPackExportError(
      "unsafe_output",
      `Export file '${fileName}' escapes the output directory.`,
    );
  }
  return destination;
}

function buildCleanDocument(data: NormalizedExport, labels: boolean): VectorDocument {
  const primitives: Primitive[] = [];
  for (const surface of orderedSurfaces(data.template)) {
    primitives.push({
      kind: "shape",
      id: surface.assetSlotId,
      shape: surface.shape!,
      fill: "none",
      stroke: PALETTE.muted,
      strokeWidth: 3,
      dash: "12 8",
      data: { "slot-id": surface.assetSlotId, "surface-id": surface.surfaceId },
    });
  }
  for (const item of data.functionalObjects) {
    const slotId = slotIdForZone(item.payload.functionalZoneId);
    primitives.push({
      kind: "shape",
      id: slotId ?? item.payload.functionalZoneId,
      shape: item.payload.visualBounds,
      fill: "none",
      stroke: PALETTE.ink,
      strokeWidth: 4,
      data: {
        ...(slotId ? { "slot-id": slotId } : {}),
        "zone-id": item.payload.functionalZoneId,
      },
    });
    if (labels) {
      const center = centerOf(item.payload.visualBounds);
      primitives.push(labelPrimitive(`label.${item.payload.functionalZoneId}`, center.x, center.y, item.payload.functionalZoneId));
    }
  }
  primitives.push({
    kind: "shape",
    id: "base.canvas.boundary",
    shape: rect(2, 2, data.template.referenceViewport.width - 4, data.template.referenceViewport.height - 4),
    fill: "none",
    stroke: PALETTE.ink,
    strokeWidth: 4,
    data: { "template-id": data.template.templateId },
  });
  return documentFor(data, "Base template clean technical contours", primitives);
}

function buildArtistDocument(data: NormalizedExport): VectorDocument {
  const primitives: Primitive[] = [];
  for (const surface of orderedSurfaces(data.template)) {
    primitives.push({
      kind: "shape",
      id: `artist.${surface.surfaceId}`,
      shape: surface.shape!,
      fill: "none",
      stroke: surface.surfaceRole === "background" ? "#000000" : "#00000066",
      strokeWidth: surface.surfaceRole === "background" ? 4 : 2,
    });
  }
  for (const item of data.functionalObjects) {
    primitives.push({
      kind: "shape",
      id: `artist.${item.node.nodeId}`,
      shape: item.payload.visualBounds,
      fill: "none",
      stroke: "#000000",
      strokeWidth: 4,
    });
  }
  primitives.push({
    kind: "shape",
    id: "artist.canvas",
    shape: rect(2, 2, data.template.referenceViewport.width - 4, data.template.referenceViewport.height - 4),
    fill: "none",
    stroke: "#000000",
    strokeWidth: 4,
  });
  return {
    ...documentFor(data, "Artist template", primitives),
    background: null,
  };
}

function buildMaskDocument(data: NormalizedExport): VectorDocument {
  const primitives: Primitive[] = [];
  let fullCanvasIndex = 0;
  for (const surface of orderedSurfaces(data.template)) {
    if (isFullCanvas(surface.shape!, data.template)) {
      const inset = 3 + fullCanvasIndex * 10;
      fullCanvasIndex += 1;
      primitives.push({
        kind: "shape",
        id: `mask.${surface.surfaceId}`,
        shape: rect(
          inset,
          inset,
          data.template.referenceViewport.width - inset * 2,
          data.template.referenceViewport.height - inset * 2,
        ),
        fill: "none",
        stroke: "#ffffff",
        strokeWidth: 4,
      });
    } else {
      primitives.push({
        kind: "shape",
        id: `mask.${surface.surfaceId}`,
        shape: surface.shape!,
        fill: "none",
        stroke: "#ffffff",
        strokeWidth: 8,
      });
    }
  }
  for (const item of data.functionalObjects) {
    if (slotIdForZone(item.payload.functionalZoneId)) {
      primitives.push({
        kind: "shape",
        id: `mask.${item.node.nodeId}`,
        shape: item.payload.visualBounds,
        fill: "#ffffff",
      });
    }
  }
  return {
    ...documentFor(data, "Binary asset-slot mask", primitives),
    background: "#000000",
  };
}

function serializeArtistOutline(data: NormalizedExport): string {
  const shapes = [
    rect(2, 2, data.template.referenceViewport.width - 4, data.template.referenceViewport.height - 4),
    ...orderedSurfaces(data.template).map((surface) => surface.shape!),
    ...data.functionalObjects.map((item) => item.payload.visualBounds),
  ];
  const body = shapes.map((shape, index) =>
    serializeOutlineShape(shape, index === 0 ? 4 : 2)
  ).join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${data.template.referenceViewport.width}" height="${data.template.referenceViewport.height}" viewBox="0 0 ${data.template.referenceViewport.width} ${data.template.referenceViewport.height}">
  ${body}
</svg>
`;
}

function serializeOutlineShape(shape: BoundsShape, strokeWidth: number): string {
  const line = `fill="none" stroke="#000000" stroke-width="${strokeWidth}"`;
  if (shape.type === "rect") {
    return `<rect x="${number(shape.x)}" y="${number(shape.y)}" width="${number(shape.width)}" height="${number(shape.height)}" ${line}/>`;
  }
  if (shape.type === "ellipse") {
    return `<ellipse cx="${number(shape.cx)}" cy="${number(shape.cy)}" rx="${number(shape.rx)}" ry="${number(shape.ry)}" ${line}/>`;
  }
  return `<polygon points="${shape.points.map((point) => `${number(point.x)},${number(point.y)}`).join(" ")}" ${line}/>`;
}

function buildZonesDocument(data: NormalizedExport): VectorDocument {
  const colors = [
    "#dbeafe", "#e0e7ff", "#fef3c7", "#fed7aa", "#dcfce7", "#cffafe", "#f3e8ff", "#fce7f3",
  ];
  const primitives: Primitive[] = [];
  orderedSurfaces(data.template).forEach((surface, index) => {
    primitives.push({
      kind: "shape",
      id: `zones.${surface.assetSlotId}`,
      shape: surface.shape!,
      fill: colors[index % colors.length],
      stroke: PALETTE.ink,
      strokeWidth: 3,
      opacity: surface.surfaceRole === "ambient" || surface.surfaceRole === "foreground" ? 0.24 : 0.62,
    });
    const center = centerOf(surface.shape!);
    primitives.push(labelPrimitive(`zones.label.${surface.assetSlotId}`, center.x, center.y, slotLabel(surface.assetSlotId)));
  });
  data.functionalObjects.forEach((item, index) => {
    primitives.push({
      kind: "shape",
      id: `zones.${item.payload.functionalZoneId}`,
      shape: item.payload.visualBounds,
      fill: colors[(index + 2) % colors.length],
      stroke: PALETTE.ink,
      strokeWidth: 5,
      opacity: 0.82,
    });
    const center = centerOf(item.payload.visualBounds);
    primitives.push(labelPrimitive(`zones.label.${item.payload.functionalZoneId}`, center.x, center.y, zoneLabel(item.payload.functionalZoneId)));
  });
  addTitle(primitives, "FUNCTIONAL AND ART ZONES");
  addLegend(primitives, [
    ["SURFACE SLOT", PALETTE.muted],
    ["FUNCTIONAL OBJECT", PALETTE.ink],
    ["BASE EXIT IS CORE-CRITICAL", PALETTE.critical],
  ]);
  return documentFor(data, "Base template functional and art zones", primitives);
}

function buildHitboxDocument(data: NormalizedExport): VectorDocument {
  const primitives: Primitive[] = [];
  for (const item of data.functionalObjects) {
    primitives.push({
      kind: "shape",
      id: `visual.${item.payload.functionalZoneId}`,
      shape: item.payload.visualBounds,
      fill: "#2563eb22",
      stroke: PALETTE.visual,
      strokeWidth: 4,
      dash: "14 8",
    });
    primitives.push({
      kind: "shape",
      id: `interaction.${item.payload.functionalZoneId}`,
      shape: item.payload.interactionBounds,
      fill: "#dc262633",
      stroke: PALETTE.interaction,
      strokeWidth: 5,
    });
    const center = centerOf(item.payload.interactionBounds);
    const label = `${item.payload.functionalZoneId} / ${item.binding.descriptorRole}`;
    primitives.push(labelPrimitive(`hitbox.label.${item.payload.functionalZoneId}`, center.x, center.y, label));
  }
  addTitle(primitives, "INTERACTION BOUNDS / HITBOXES");
  addLegend(primitives, [
    ["VISUAL BOUNDS", PALETTE.visual],
    ["INTERACTION BOUNDS", PALETTE.interaction],
  ]);
  return documentFor(data, "Base template interaction bounds", primitives);
}

function buildSafeAreaDocument(data: NormalizedExport): VectorDocument {
  const primitives: Primitive[] = [];
  for (const safeArea of data.template.safeAreas) {
    const color = safeArea.critical ? PALETTE.critical : PALETTE.safe;
    primitives.push({
      kind: "shape",
      id: safeArea.safeAreaId,
      shape: safeArea.shape,
      fill: safeArea.critical ? "#e11d4810" : "#0891b210",
      stroke: color,
      strokeWidth: 5,
      dash: "18 10",
    });
  }
  for (const item of data.functionalObjects) {
    for (const [role, shape, color] of [
      ["effect", item.payload.effectBounds, PALETTE.effect],
      ["layout", item.payload.layoutBounds, PALETTE.layout],
      ["visual", item.payload.visualBounds, PALETTE.visual],
      ...(item.payload.labelBounds
        ? ([["label", item.payload.labelBounds, PALETTE.label]] as const)
        : []),
    ] as const) {
      primitives.push({
        kind: "shape",
        id: `${role}.${item.payload.functionalZoneId}`,
        shape,
        fill: "none",
        stroke: color,
        strokeWidth: role === "visual" ? 4 : 3,
        dash: role === "effect" ? "8 8" : undefined,
      });
    }
    for (const anchorId of item.payload.anchorIds) {
      const anchor = data.template.anchors.find((candidate) => candidate.anchorId === anchorId)!;
      const ownerShape = anchor.owner === "label" && item.payload.labelBounds
        ? item.payload.labelBounds
        : anchor.owner === "interaction"
          ? item.payload.interactionBounds
          : item.payload.visualBounds;
      const point = pointInBounds(ownerShape, anchor.x, anchor.y);
      primitives.push(...anchorPrimitives(anchorId, point.x, point.y));
    }
  }
  addTitle(primitives, "SAFE AREAS / BOUNDS / ANCHORS");
  addLegend(primitives, [
    ["VISUAL", PALETTE.visual],
    ["LAYOUT", PALETTE.layout],
    ["EFFECT OVERFLOW", PALETTE.effect],
    ["LABEL", PALETTE.label],
    ["CRITICAL SAFE AREA", PALETTE.critical],
    ["ANCHOR", PALETTE.anchor],
  ]);
  return documentFor(data, "Base template safe areas and bounds", primitives);
}

function buildDepthDocument(data: NormalizedExport): VectorDocument {
  const layerColors = new Map([
    ["background", "#e0f2fe"],
    ["architecture-rear", "#dbeafe"],
    ["scene", "#fef3c7"],
    ["ambient-front", "#f3e8ff"],
    ["foreground", "#fee2e2"],
    ["navigation", "#dcfce7"],
  ]);
  const primitives: Primitive[] = [];
  for (const surface of orderedSurfaces(data.template)) {
    primitives.push({
      kind: "shape",
      id: `depth.${surface.surfaceId}`,
      shape: surface.shape!,
      fill: layerColors.get(surface.layerBandId) ?? "#e5e7eb",
      stroke: PALETTE.ink,
      strokeWidth: 3,
      opacity: surface.surfaceRole === "ambient" || surface.surfaceRole === "foreground" ? 0.28 : 0.72,
    });
  }
  for (const item of [...data.functionalObjects].sort((a, b) => a.node.localOrder - b.node.localOrder)) {
    primitives.push({
      kind: "shape",
      id: `depth.${item.node.nodeId}`,
      shape: item.payload.visualBounds,
      fill: layerColors.get(item.node.layerBand) ?? "#fef3c7",
      stroke: PALETTE.ink,
      strokeWidth: 4,
      opacity: 0.85,
    });
    const center = centerOf(item.payload.visualBounds);
    primitives.push(labelPrimitive(
      `depth.label.${item.node.nodeId}`,
      center.x,
      center.y,
      `${item.node.layerBand} / ${item.node.localOrder}`,
    ));
  }
  addTitle(primitives, "LAYER AND DEPTH ORDER");
  const relevantBands = data.template.layerBands.filter((band) =>
    ["background", "architecture-rear", "scene", "ambient-front", "foreground", "navigation"].includes(band.bandId),
  );
  addLegend(primitives, relevantBands.map((band) => [
    `${band.bandId} ${band.minimum}..${band.maximum}`,
    layerColors.get(band.bandId) ?? "#e5e7eb",
  ]));
  return documentFor(data, "Base template layer and depth order", primitives);
}

function buildExportSpec(data: NormalizedExport): unknown {
  const slots = [...(data.template.assetSlots ?? [])]
    .sort((a, b) => compareStrings(a.slotId, b.slotId))
    .map((slot) => {
      const surface = data.template.surfaces.find((candidate) => candidate.assetSlotId === slot.slotId);
      const zoneId = zoneIdForSlot(slot.slotId);
      const object = data.functionalObjects.find((candidate) => candidate.payload.functionalZoneId === zoneId);
      return {
        ...slot,
        stableId: slot.slotId,
        ...(surface ? { surfaceId: surface.surfaceId, bounds: surface.shape, layer: surface.layerBandId } : {}),
        ...(object ? { functionalZoneId: object.payload.functionalZoneId, bounds: object.payload.visualBounds } : {}),
      };
    });
  const functionalObjects = [...data.functionalObjects]
    .sort((a, b) => compareStrings(a.payload.functionalZoneId, b.payload.functionalZoneId))
    .map(({ node, payload, binding }) => ({
      stableId: payload.functionalZoneId,
      nodeId: node.nodeId,
      role: data.template.functionalZones.find((zone) => zone.zoneId === payload.functionalZoneId)!.role,
      actionRole: payload.actionRole,
      bounds: {
        visual: payload.visualBounds,
        interaction: payload.interactionBounds,
        layout: payload.layoutBounds,
        effect: payload.effectBounds,
        ...(payload.labelBounds ? { label: payload.labelBounds } : {}),
      },
      anchorIds: [...payload.anchorIds].sort(),
      layer: { bandId: node.layerBand, localOrder: node.localOrder },
      states: data.template.states.map((state) => state.stateId).sort(),
      functionBinding: {
        bindingId: binding.bindingId,
        functionalZoneId: binding.functionalZoneId,
        descriptorRole: binding.descriptorRole,
        source: "core-contract",
      },
    }));
  return {
    schemaVersion: 1,
    exporter: {
      id: ART_PACK_EXPORTER_ID,
      version: ART_PACK_EXPORTER_VERSION,
      deterministic: true,
      fingerprintAlgorithm: "sha256",
      inputFingerprint: data.fingerprint,
    },
    template: {
      templateId: data.template.templateId,
      version: data.template.version,
      environmentKind: data.template.environmentKind,
    },
    canvas: data.template.referenceViewport,
    files: [...BASE_ART_PACK_FILES],
    slots,
    functionalObjects,
    functionalZones: [...data.template.functionalZones].sort((a, b) =>
      compareStrings(a.zoneId, b.zoneId)
    ),
    surfaces: [...data.template.surfaces].sort((a, b) => compareStrings(a.surfaceId, b.surfaceId)),
    safeAreas: [...data.template.safeAreas].sort((a, b) => compareStrings(a.safeAreaId, b.safeAreaId)),
    anchors: [...data.template.anchors].sort((a, b) => compareStrings(a.anchorId, b.anchorId)),
    layers: [...data.template.layerBands].sort((a, b) => a.minimum - b.minimum),
    states: [...data.template.states].sort((a, b) => compareStrings(a.stateId, b.stateId)),
    exportMetadata: {
      canonicalSource: "base-template-clean.svg",
      coordinateSpace: "template-reference-viewport",
      generatedAt: null,
      executableContent: false,
      externalNetworkContent: false,
    },
    artistExport: {
      directory: "artist",
      artistTemplate: "artist/base-template-artist.png",
      outline: "artist/base-template-outline.svg",
      mask: "artist/base-template-mask.png",
      prompt: "artist/prompt.md",
      monochrome: true,
      labels: false,
      technicalIds: false,
      transparentArtistCanvas: true,
      binaryMask: true,
    },
  };
}

function buildArtistBrief(data: NormalizedExport): string {
  const canvas = data.template.referenceViewport;
  const assetLines = (data.template.assetSlots ?? [])
    .map((slot) => `- \`${slot.slotId}\`: ${slot.purpose}; ${slot.acceptedFormats.join(", ")}`)
    .join("\n");
  return `# Art brief: ${data.template.templateId}

## Auftrag

Erstelle einen austauschbaren Dekorsatz für die technische Base-Vorlage. Beispiel: „Fantasy-Base im Inneren eines Elfenbaums mit zwei Türen und zwei Workspaces“.

## Dokument

- Canvas: ${canvas.width} × ${canvas.height} ${canvas.unit}, Ursprung links oben
- Perspektive: frontale Innenraumansicht; die kanonische Geometrie definiert Türen, Workspaces, Companion und Exit
- Kanonische Quelle: \`base-template-clean.svg\`
- Kontrollansichten: Zones, Hitboxes, Safe Areas und Depth als PNG

## Unveränderliche Regeln

- Slot-IDs, Funktionsrollen, Function Bindings, Canvas und Anchor-IDs dürfen nicht geändert werden.
- Interaction Bounds, Layout Bounds, Labels und der kritische Base-Exit dürfen nicht verdeckt oder in ihrer Funktion verändert werden.
- Themes enthalten keine Scripts, HTML-, Shader- oder sonstigen ausführbaren Inhalte.
- Externe Netzwerkreferenzen sind verboten.

## Erlaubter visueller Overflow

Dekoration darf innerhalb der jeweiligen Effect Bounds über die Visual Bounds hinausragen. Sie darf keine kritische Safe Area, fremde Hitbox oder den Base-Exit blockieren. Transparenter Overflow ist für SVG, PNG und WebP erlaubt; Ambient- und Foreground-Animationen dürfen später als WebM/MP4 geliefert werden.

## Benötigte Einzelassets

${assetLines}

Rasterassets müssen die im Spec genannten Pixelmaße und sRGB verwenden. SVG bleibt rein deklarativ. Die Dateinamen im finalen Skin Pack werden über Asset References gebunden; die stabilen Slot-IDs sind die Übergabepunkte.
`;
}

function buildCreativePrompt(data: NormalizedExport): string {
  const canvas = data.template.referenceViewport;
  const doors = data.template.functionalZones.filter((zone) => zone.role === "door");
  const workspaces = data.template.functionalZones.filter((zone) => zone.role === "workspace.entry");
  const companion = data.functionalObjects.find(
    (item) => item.payload.functionalZoneId === BASE_FUNCTIONAL_ZONE_IDS.companion,
  );
  const companionCenter = companion ? centerOf(companion.payload.visualBounds) : { x: 0, y: 0 };
  const formats = [...new Set(
    (data.template.assetSlots ?? []).flatMap((slot) => slot.acceptedFormats),
  )].sort(compareStrings);
  return `# Artist Prompt

## Vorlage

- Canvasgröße: ${canvas.width} × ${canvas.height} Pixel
- Perspektive: frontale Environment-Ansicht eines Innenraums
- Kamerawinkel: gerade und mittig, ohne Änderung der vorgegebenen Geometrie
- Türen: ${doors.length}
- Workspaces: ${workspaces.length}
- Companion-Position: mittig bei ungefähr x=${number(companionCenter.x)}, y=${number(companionCenter.y)}
- Hintergrund: darf vollständig gestaltet werden, muss aber die Objekt-Silhouetten lesbar halten
- Vordergrund: darf dekorative Tiefe erzeugen, jedoch keine funktionalen Bereiche verdecken
- Gewünschte Dateiformate: ${formats.join(", ")}

## Technische Grenzen

Visuals dürfen innerhalb der ausgewiesenen Effect Bounds über ihre sichtbare Grundform hinausragen. Interaction Bounds dürfen weder verschoben, skaliert noch verdeckt werden. Das Layout, die Anzahl und Position der Funktionsobjekte sowie der sichere Ausgang müssen erhalten bleiben. Die Artist-Vorlage darf bemalt werden; ihre Konturen dienen als unveränderliche Geometrieträger.

## Creative Prompt

Erstelle ein hochwertiges Environment passend zur gelieferten Vorlage. Die Szene darf vollständig frei gestaltet werden, solange die technischen Zonen erhalten bleiben. Gestalte Hintergrund, Architektur, Türen, Workspaces, Companion und Vordergrund als zusammenhängende visuelle Welt. Liefere keine Beschriftungen, UI-Elemente oder technischen Markierungen im finalen Artwork.
`;
}

function documentFor(data: NormalizedExport, title: string, primitives: readonly Primitive[]): VectorDocument {
  return {
    width: data.template.referenceViewport.width,
    height: data.template.referenceViewport.height,
    title,
    primitives,
  };
}

function orderedSurfaces(template: EnvironmentTemplate) {
  const layerOrder = new Map(template.layerBands.map((band) => [band.bandId, band.minimum]));
  return [...template.surfaces].sort((a, b) =>
    (layerOrder.get(a.layerBandId) ?? 0) - (layerOrder.get(b.layerBandId) ?? 0)
      || compareStrings(a.surfaceId, b.surfaceId),
  );
}

function addTitle(primitives: Primitive[], title: string): void {
  primitives.push({
    kind: "text",
    id: "document.title",
    x: 800,
    y: 36,
    text: title,
    fill: PALETTE.ink,
    size: 18,
    background: "#f7f7f4dd",
  });
}

function addLegend(primitives: Primitive[], entries: readonly (readonly [string, string])[]): void {
  const x = 1190;
  const y = 52;
  const lineHeight = 24;
  primitives.push({
    kind: "shape",
    id: "document.legend.background",
    shape: rect(x - 18, y - 18, 395, entries.length * lineHeight + 28),
    fill: "#ffffffdd",
    stroke: PALETTE.ink,
    strokeWidth: 2,
  });
  entries.forEach(([label, color], index) => {
    const rowY = y + index * lineHeight;
    primitives.push({
      kind: "shape",
      id: `document.legend.swatch.${index}`,
      shape: rect(x, rowY - 11, 18, 14),
      fill: color,
      stroke: PALETTE.ink,
      strokeWidth: 1,
    });
    primitives.push({
      kind: "text",
      id: `document.legend.label.${index}`,
      x: x + 28,
      y: rowY,
      text: label,
      fill: PALETTE.ink,
      size: 12,
    });
  });
}

function labelPrimitive(id: string, x: number, y: number, text: string): Primitive {
  return {
    kind: "text",
    id,
    x,
    y,
    text: text.toUpperCase(),
    fill: PALETTE.ink,
    size: 11,
    background: "#ffffffdd",
  };
}

function anchorPrimitives(id: string, x: number, y: number): Primitive[] {
  return [
    { kind: "line", id: `${id}.horizontal`, x1: x - 10, y1: y, x2: x + 10, y2: y, stroke: PALETTE.anchor, strokeWidth: 3 },
    { kind: "line", id: `${id}.vertical`, x1: x, y1: y - 10, x2: x, y2: y + 10, stroke: PALETTE.anchor, strokeWidth: 3 },
    { kind: "text", id: `${id}.label`, x: x + 14, y: y + 4, text: id.toUpperCase(), fill: PALETTE.anchor, size: 8, background: "#ffffffcc" },
  ];
}

function serializeSvg(document: VectorDocument): string {
  const body = document.primitives.map(serializePrimitive).join("\n  ");
  const background = document.background === null
    ? ""
    : `\n  <rect id="base.canvas" width="${document.width}" height="${document.height}" fill="${document.background ?? PALETTE.canvas}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}" role="img" aria-labelledby="document-title">
  <title id="document-title">${escapeXml(document.title)}</title>${background}
  ${body}
</svg>
`;
}

function serializePrimitive(primitive: Primitive): string {
  if (primitive.kind === "line") {
    return `<line id="${escapeXml(primitive.id)}" x1="${number(primitive.x1)}" y1="${number(primitive.y1)}" x2="${number(primitive.x2)}" y2="${number(primitive.y2)}" stroke="${primitive.stroke}" stroke-width="${primitive.strokeWidth}"/>`;
  }
  if (primitive.kind === "text") {
    const background = primitive.background
      ? `<rect x="${number(primitive.x - textWidth(primitive.text, primitive.size) / 2 - 5)}" y="${number(primitive.y - primitive.size)}" width="${number(textWidth(primitive.text, primitive.size) + 10)}" height="${number(primitive.size + 7)}" fill="${primitive.background}"/>`
      : "";
    return `<g id="${escapeXml(primitive.id)}">${background}<text x="${number(primitive.x)}" y="${number(primitive.y)}" fill="${primitive.fill}" font-family="monospace" font-size="${primitive.size}" text-anchor="middle">${escapeXml(primitive.text)}</text></g>`;
  }
  const attributes = [
    `id="${escapeXml(primitive.id)}"`,
    ...(primitive.fill ? [`fill="${primitive.fill}"`] : []),
    ...(primitive.stroke ? [`stroke="${primitive.stroke}"`] : []),
    ...(primitive.strokeWidth ? [`stroke-width="${primitive.strokeWidth}"`] : []),
    ...(primitive.dash ? [`stroke-dasharray="${primitive.dash}"`] : []),
    ...(primitive.opacity !== undefined ? [`opacity="${primitive.opacity}"`] : []),
    ...Object.entries(primitive.data ?? {}).sort(([a], [b]) => compareStrings(a, b)).map(
      ([key, value]) => `data-${key}="${escapeXml(value)}"`,
    ),
  ].join(" ");
  const shape = primitive.shape;
  if (shape.type === "rect") {
    return `<rect ${attributes} x="${number(shape.x)}" y="${number(shape.y)}" width="${number(shape.width)}" height="${number(shape.height)}"${shape.radius ? ` rx="${number(shape.radius)}"` : ""}/>`;
  }
  if (shape.type === "ellipse") {
    return `<ellipse ${attributes} cx="${number(shape.cx)}" cy="${number(shape.cy)}" rx="${number(shape.rx)}" ry="${number(shape.ry)}"/>`;
  }
  return `<polygon ${attributes} points="${shape.points.map((point) => `${number(point.x)},${number(point.y)}`).join(" ")}"/>`;
}

function renderPng(document: VectorDocument, compressionLevel: number): Buffer {
  const pixels = Buffer.alloc(document.width * document.height * 4);
  if (document.background !== null) {
    fillCanvas(
      pixels,
      document.width,
      document.height,
      parseColor(document.background ?? PALETTE.canvas),
    );
  }
  for (const primitive of document.primitives) {
    rasterPrimitive(pixels, document.width, document.height, primitive);
  }
  const scanlines = Buffer.alloc((document.width * 4 + 1) * document.height);
  for (let y = 0; y < document.height; y += 1) {
    const sourceOffset = y * document.width * 4;
    const targetOffset = y * (document.width * 4 + 1);
    scanlines[targetOffset] = 0;
    pixels.copy(scanlines, targetOffset + 1, sourceOffset, sourceOffset + document.width * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr(document.width, document.height)),
    pngChunk("IDAT", deflateSync(scanlines, { level: compressionLevel })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function rasterPrimitive(pixels: Buffer, width: number, height: number, primitive: Primitive): void {
  if (primitive.kind === "line") {
    drawLine(pixels, width, height, primitive.x1, primitive.y1, primitive.x2, primitive.y2, primitive.strokeWidth, parseColor(primitive.stroke));
    return;
  }
  if (primitive.kind === "text") {
    drawText(pixels, width, height, primitive);
    return;
  }
  const fill = primitive.fill && primitive.fill !== "none" ? parseColor(primitive.fill, primitive.opacity) : undefined;
  const stroke = primitive.stroke ? parseColor(primitive.stroke, primitive.opacity) : undefined;
  if (primitive.shape.type === "rect") {
    if (fill) fillRect(pixels, width, height, primitive.shape.x, primitive.shape.y, primitive.shape.width, primitive.shape.height, fill);
    if (stroke) strokeRect(pixels, width, height, primitive.shape, primitive.strokeWidth ?? 1, stroke);
  } else if (primitive.shape.type === "ellipse") {
    rasterEllipse(pixels, width, height, primitive.shape, fill, stroke, primitive.strokeWidth ?? 1);
  } else {
    rasterPolygon(pixels, width, height, primitive.shape.points, fill, stroke, primitive.strokeWidth ?? 1);
  }
}

type Color = readonly [number, number, number, number];

function parseColor(value: string, opacity = 1): Color {
  const hex = value.startsWith("#") ? value.slice(1) : value;
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) return [0, 0, 0, Math.round(255 * opacity)];
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
    Math.round((hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) : 255) * opacity),
  ];
}

function fillCanvas(pixels: Buffer, width: number, height: number, color: Color): void {
  for (let index = 0; index < width * height; index += 1) {
    pixels[index * 4] = color[0];
    pixels[index * 4 + 1] = color[1];
    pixels[index * 4 + 2] = color[2];
    pixels[index * 4 + 3] = color[3];
  }
}

function blendPixel(pixels: Buffer, width: number, height: number, x: number, y: number, color: Color): void {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= width || py >= height || color[3] === 0) return;
  const index = (py * width + px) * 4;
  const alpha = color[3] / 255;
  const inverse = 1 - alpha;
  pixels[index] = Math.round(color[0] * alpha + pixels[index] * inverse);
  pixels[index + 1] = Math.round(color[1] * alpha + pixels[index + 1] * inverse);
  pixels[index + 2] = Math.round(color[2] * alpha + pixels[index + 2] * inverse);
  pixels[index + 3] = 255;
}

function fillRect(pixels: Buffer, width: number, height: number, x: number, y: number, w: number, h: number, color: Color): void {
  for (let py = Math.max(0, Math.floor(y)); py < Math.min(height, Math.ceil(y + h)); py += 1) {
    for (let px = Math.max(0, Math.floor(x)); px < Math.min(width, Math.ceil(x + w)); px += 1) {
      blendPixel(pixels, width, height, px, py, color);
    }
  }
}

function strokeRect(pixels: Buffer, width: number, height: number, shape: Extract<BoundsShape, { type: "rect" }>, thickness: number, color: Color): void {
  fillRect(pixels, width, height, shape.x, shape.y, shape.width, thickness, color);
  fillRect(pixels, width, height, shape.x, shape.y + shape.height - thickness, shape.width, thickness, color);
  fillRect(pixels, width, height, shape.x, shape.y, thickness, shape.height, color);
  fillRect(pixels, width, height, shape.x + shape.width - thickness, shape.y, thickness, shape.height, color);
}

function drawLine(pixels: Buffer, width: number, height: number, x1: number, y1: number, x2: number, y2: number, thickness: number, color: Color): void {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
  const radius = Math.max(0, Math.floor(thickness / 2));
  for (let step = 0; step <= steps; step += 1) {
    const x = x1 + ((x2 - x1) * step) / steps;
    const y = y1 + ((y2 - y1) * step) / steps;
    fillRect(pixels, width, height, x - radius, y - radius, radius * 2 + 1, radius * 2 + 1, color);
  }
}

function rasterEllipse(
  pixels: Buffer,
  width: number,
  height: number,
  shape: Extract<BoundsShape, { type: "ellipse" }>,
  fill: Color | undefined,
  stroke: Color | undefined,
  strokeWidth: number,
): void {
  const innerRx = Math.max(0, shape.rx - strokeWidth);
  const innerRy = Math.max(0, shape.ry - strokeWidth);
  for (let y = Math.floor(shape.cy - shape.ry); y <= Math.ceil(shape.cy + shape.ry); y += 1) {
    for (let x = Math.floor(shape.cx - shape.rx); x <= Math.ceil(shape.cx + shape.rx); x += 1) {
      const outer = ((x - shape.cx) ** 2) / shape.rx ** 2 + ((y - shape.cy) ** 2) / shape.ry ** 2 <= 1;
      if (!outer) continue;
      const inner = innerRx > 0 && innerRy > 0
        && ((x - shape.cx) ** 2) / innerRx ** 2 + ((y - shape.cy) ** 2) / innerRy ** 2 <= 1;
      if (stroke && !inner) blendPixel(pixels, width, height, x, y, stroke);
      else if (fill) blendPixel(pixels, width, height, x, y, fill);
    }
  }
}

function rasterPolygon(
  pixels: Buffer,
  width: number,
  height: number,
  points: readonly { x: number; y: number }[],
  fill: Color | undefined,
  stroke: Color | undefined,
  strokeWidth: number,
): void {
  if (fill && points.length >= 3) {
    const minX = Math.floor(Math.min(...points.map((point) => point.x)));
    const maxX = Math.ceil(Math.max(...points.map((point) => point.x)));
    const minY = Math.floor(Math.min(...points.map((point) => point.y)));
    const maxY = Math.ceil(Math.max(...points.map((point) => point.y)));
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (pointInPolygon(x, y, points)) blendPixel(pixels, width, height, x, y, fill);
      }
    }
  }
  if (stroke) {
    points.forEach((point, index) => {
      const next = points[(index + 1) % points.length];
      drawLine(pixels, width, height, point.x, point.y, next.x, next.y, strokeWidth, stroke);
    });
  }
}

function pointInPolygon(x: number, y: number, points: readonly { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const a = points[i];
    const b = points[j];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

const FONT: Readonly<Record<string, readonly string[]>> = {
  " ": ["000", "000", "000", "000", "000", "000", "000"],
  ".": ["0", "0", "0", "0", "0", "1", "1"], "-": ["000", "000", "000", "111", "000", "000", "000"],
  "_": ["000", "000", "000", "000", "000", "000", "111"], "/": ["001", "001", "010", "010", "100", "100", "100"],
  ":": ["0", "1", "1", "0", "1", "1", "0"],
  "0": ["111", "101", "101", "101", "101", "101", "111"], "1": ["010", "110", "010", "010", "010", "010", "111"],
  "2": ["111", "001", "001", "111", "100", "100", "111"], "3": ["111", "001", "001", "111", "001", "001", "111"],
  "4": ["101", "101", "101", "111", "001", "001", "001"], "5": ["111", "100", "100", "111", "001", "001", "111"],
  "6": ["111", "100", "100", "111", "101", "101", "111"], "7": ["111", "001", "001", "010", "010", "100", "100"],
  "8": ["111", "101", "101", "111", "101", "101", "111"], "9": ["111", "101", "101", "111", "001", "001", "111"],
  A: ["010", "101", "101", "111", "101", "101", "101"], B: ["110", "101", "101", "110", "101", "101", "110"],
  C: ["011", "100", "100", "100", "100", "100", "011"], D: ["110", "101", "101", "101", "101", "101", "110"],
  E: ["111", "100", "100", "110", "100", "100", "111"], F: ["111", "100", "100", "110", "100", "100", "100"],
  G: ["011", "100", "100", "101", "101", "101", "011"], H: ["101", "101", "101", "111", "101", "101", "101"],
  I: ["111", "010", "010", "010", "010", "010", "111"], J: ["001", "001", "001", "001", "101", "101", "010"],
  K: ["101", "101", "110", "100", "110", "101", "101"], L: ["100", "100", "100", "100", "100", "100", "111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"], N: ["1001", "1101", "1101", "1011", "1011", "1001", "1001"],
  O: ["010", "101", "101", "101", "101", "101", "010"], P: ["110", "101", "101", "110", "100", "100", "100"],
  Q: ["010", "101", "101", "101", "101", "011", "001"], R: ["110", "101", "101", "110", "101", "101", "101"],
  S: ["011", "100", "100", "010", "001", "001", "110"], T: ["111", "010", "010", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "101", "101", "111"], V: ["101", "101", "101", "101", "101", "101", "010"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"], X: ["101", "101", "101", "010", "101", "101", "101"],
  Y: ["101", "101", "101", "010", "010", "010", "010"], Z: ["111", "001", "001", "010", "100", "100", "111"],
};

function drawText(pixels: Buffer, width: number, height: number, primitive: Extract<Primitive, { kind: "text" }>): void {
  const value = primitive.text.toUpperCase();
  const scale = Math.max(1, Math.floor(primitive.size / 7));
  const glyphWidths = [...value].map((character) => (FONT[character] ?? FONT[" "])[0].length);
  const totalWidth = glyphWidths.reduce((sum, glyphWidth) => sum + (glyphWidth + 1) * scale, 0);
  const startX = Math.round(primitive.x - totalWidth / 2);
  const startY = Math.round(primitive.y - 7 * scale);
  if (primitive.background) {
    fillRect(pixels, width, height, startX - 4, startY - 3, totalWidth + 8, 7 * scale + 7, parseColor(primitive.background));
  }
  const color = parseColor(primitive.fill);
  let cursor = startX;
  for (const character of value) {
    const glyph = FONT[character] ?? FONT[" "];
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((cell, columnIndex) => {
        if (cell === "1") fillRect(pixels, width, height, cursor + columnIndex * scale, startY + rowIndex * scale, scale, scale, color);
      });
    });
    cursor += (glyph[0].length + 1) * scale;
  }
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, "ascii");
  const payload = Buffer.concat([typeBuffer, data]);
  return Buffer.concat([uint32(data.length), payload, uint32(crc32(payload))]);
}

function ihdr(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(13);
  buffer.writeUInt32BE(width, 0);
  buffer.writeUInt32BE(height, 4);
  buffer[8] = 8;
  buffer[9] = 6;
  buffer[10] = 0;
  buffer[11] = 0;
  buffer[12] = 0;
  return buffer;
}

function uint32(...values: number[]): Buffer {
  const buffer = Buffer.alloc(values.length * 4);
  values.forEach((value, index) => buffer.writeUInt32BE(value >>> 0, index * 4));
  return buffer;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function stableStringify(value: unknown): string {
  return `${JSON.stringify(sortJson(value), null, 2)}\n`;
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => compareStrings(a, b)).map(
      ([key, nested]) => [key, sortJson(nested)],
    ));
  }
  return value;
}

function slotIdForZone(zoneId: string): string | undefined {
  return ({
    [BASE_FUNCTIONAL_ZONE_IDS.leftDoor]: BASE_SLOT_IDS.leftDoor,
    [BASE_FUNCTIONAL_ZONE_IDS.rightDoor]: BASE_SLOT_IDS.rightDoor,
    [BASE_FUNCTIONAL_ZONE_IDS.leftWorkspace]: BASE_SLOT_IDS.leftWorkspace,
    [BASE_FUNCTIONAL_ZONE_IDS.rightWorkspace]: BASE_SLOT_IDS.rightWorkspace,
    [BASE_FUNCTIONAL_ZONE_IDS.companion]: BASE_SLOT_IDS.companion,
  } as Record<string, string>)[zoneId];
}

function zoneIdForSlot(slotId: string): string | undefined {
  return Object.values(BASE_FUNCTIONAL_ZONE_IDS).find((zoneId) => slotIdForZone(zoneId) === slotId);
}

function slotLabel(slotId: string): string {
  return slotId.replace(/^base\.slot\./, "");
}

function zoneLabel(zoneId: string): string {
  return zoneId === BASE_FUNCTIONAL_ZONE_IDS.baseExit ? "base-exit" : zoneId.replace(/^base\.zone\./, "");
}

function rect(x: number, y: number, width: number, height: number): BoundsShape {
  return { type: "rect", x, y, width, height };
}

function centerOf(shape: BoundsShape): { x: number; y: number } {
  if (shape.type === "rect") return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  if (shape.type === "ellipse") return { x: shape.cx, y: shape.cy };
  return {
    x: shape.points.reduce((sum, point) => sum + point.x, 0) / shape.points.length,
    y: shape.points.reduce((sum, point) => sum + point.y, 0) / shape.points.length,
  };
}

function pointInBounds(shape: BoundsShape, relativeX: number, relativeY: number): { x: number; y: number } {
  if (shape.type === "rect") return { x: shape.x + shape.width * relativeX, y: shape.y + shape.height * relativeY };
  if (shape.type === "ellipse") return { x: shape.cx + shape.rx * (relativeX * 2 - 1), y: shape.cy + shape.ry * (relativeY * 2 - 1) };
  const xs = shape.points.map((point) => point.x);
  const ys = shape.points.map((point) => point.y);
  return {
    x: Math.min(...xs) + (Math.max(...xs) - Math.min(...xs)) * relativeX,
    y: Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * relativeY,
  };
}

function textWidth(value: string, size: number): number {
  return value.length * size * 0.62;
}

function number(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isFullCanvas(shape: BoundsShape, template: EnvironmentTemplate): boolean {
  return shape.type === "rect"
    && shape.x === 0
    && shape.y === 0
    && shape.width === template.referenceViewport.width
    && shape.height === template.referenceViewport.height;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
