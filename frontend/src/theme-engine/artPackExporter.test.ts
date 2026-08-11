import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { inflateSync } from "node:zlib";

import { afterEach, describe, expect, it } from "vitest";

import {
  BASE_ART_PACK_FILES,
  EnvironmentArtPackExportError,
  exportArtPack,
  exportEnvironmentArtPack,
} from "../../scripts/theme-art-exporter";
import {
  BASE_FUNCTIONAL_ZONE_IDS,
  BASE_MAIN_ROOM_TEMPLATE_ID,
  BASE_SLOT_IDS,
  baseMainRoomTemplate,
} from "./baseTemplate";
import {
  coreDefaultBaseComposition,
  coreDefaultBaseFunctionBindings,
} from "./coreDefaultBaseSkin";

const execFileAsync = promisify(execFile);
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })
  ));
});

describe("environment art-pack exporter", () => {
  it("exports the complete Base art pack with stable slots and functional objects", async () => {
    const outputDirectory = await temporaryDirectory("complete");
    await exportBase(outputDirectory);

    expect((await relativeFiles(outputDirectory)).sort()).toEqual([...BASE_ART_PACK_FILES].sort());
    const spec = await readSpec(outputDirectory);
    expect(spec.template).toMatchObject({
      templateId: BASE_MAIN_ROOM_TEMPLATE_ID,
      version: baseMainRoomTemplate.version,
    });
    expect(spec.canvas).toMatchObject({ width: 1600, height: 900 });
    expect(spec.slots.map((slot) => slot.stableId).sort()).toEqual(
      Object.values(BASE_SLOT_IDS).sort(),
    );
    expect(spec.functionalObjects.map((object) => object.stableId).sort()).toEqual(
      Object.values(BASE_FUNCTIONAL_ZONE_IDS).sort(),
    );
  });

  it("keeps visual and interaction bounds independently machine-readable", async () => {
    const outputDirectory = await temporaryDirectory("bounds");
    await exportBase(outputDirectory);
    const spec = await readSpec(outputDirectory);

    for (const object of spec.functionalObjects) {
      expect(object.bounds.visual).toBeDefined();
      expect(object.bounds.interaction).toBeDefined();
    }
    const leftDoor = spec.functionalObjects.find(
      (object) => object.stableId === BASE_FUNCTIONAL_ZONE_IDS.leftDoor,
    )!;
    expect(leftDoor.bounds.visual).not.toEqual(leftDoor.bounds.interaction);
  });

  it("produces deterministic JSON and SVG bytes", async () => {
    const first = await temporaryDirectory("deterministic-first");
    const second = await temporaryDirectory("deterministic-second");
    await exportBase(first);
    await exportBase(second);

    await expect(readFile(path.join(first, "base-template-spec.json"))).resolves.toEqual(
      await readFile(path.join(second, "base-template-spec.json")),
    );
    await expect(readFile(path.join(first, "base-template-clean.svg"))).resolves.toEqual(
      await readFile(path.join(second, "base-template-clean.svg")),
    );
  });

  it("exports the complete deterministic Artist package", async () => {
    const first = await temporaryDirectory("artist-first");
    const second = await temporaryDirectory("artist-second");
    await exportBase(first);
    await exportBase(second);

    const artistFiles = BASE_ART_PACK_FILES.filter((file) => file.startsWith("artist/"));
    expect(artistFiles).toEqual([
      "artist/base-template-artist.png",
      "artist/base-template-outline.svg",
      "artist/base-template-mask.png",
      "artist/prompt.md",
    ]);
    for (const fileName of artistFiles) {
      await expect(readFile(path.join(first, fileName))).resolves.toEqual(
        await readFile(path.join(second, fileName)),
      );
    }
  });

  it("creates a valid monochrome outline without technical content", async () => {
    const outputDirectory = await temporaryDirectory("outline");
    await exportBase(outputDirectory);
    const outline = await readFile(
      path.join(outputDirectory, "artist", "base-template-outline.svg"),
      "utf8",
    );

    expect(outline).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(outline.trimEnd().endsWith("</svg>")).toBe(true);
    expect(outline).not.toMatch(/\bid=/);
    expect(outline).not.toContain("data-");
    expect(outline).not.toContain("<text");
    expect(outline).not.toContain("<title");
    expect(outline).not.toContain("base.");
    expect([...outline.matchAll(/#[0-9a-f]{6}/gi)].map((match) => match[0])).toEqual(
      expect.arrayContaining(["#000000"]),
    );
    expect(outline.replaceAll("#000000", "")).not.toMatch(/#[0-9a-f]{6}/i);
  });

  it("renders the Artist PNG transparent, monochrome, and label-free", async () => {
    const outputDirectory = await temporaryDirectory("artist-png");
    await exportBase(outputDirectory);
    const png = decodeRgbaPng(
      await readFile(path.join(outputDirectory, "artist", "base-template-artist.png")),
    );

    expect(png.width).toBe(1600);
    expect(png.height).toBe(900);
    let transparentPixels = 0;
    let contourPixels = 0;
    let monochrome = true;
    for (let index = 0; index < png.pixels.length; index += 4) {
      const [red, green, blue, alpha] = png.pixels.subarray(index, index + 4);
      if (red !== green || green !== blue) monochrome = false;
      if (alpha === 0) transparentPixels += 1;
      else contourPixels += 1;
    }
    expect(monochrome).toBe(true);
    expect(transparentPixels).toBeGreaterThan(0);
    expect(contourPixels).toBeGreaterThan(0);
  });

  it("renders an opaque binary slot mask with black and white pixels", async () => {
    const outputDirectory = await temporaryDirectory("mask");
    await exportBase(outputDirectory);
    const png = decodeRgbaPng(
      await readFile(path.join(outputDirectory, "artist", "base-template-mask.png")),
    );
    const colors = new Set<string>();
    let binaryAndOpaque = true;
    for (let index = 0; index < png.pixels.length; index += 4) {
      const [red, green, blue, alpha] = png.pixels.subarray(index, index + 4);
      if (
        alpha !== 255
        || red !== green
        || green !== blue
        || (red !== 0 && red !== 255)
      ) {
        binaryAndOpaque = false;
      }
      colors.add(`${red},${green},${blue}`);
    }
    expect(binaryAndOpaque).toBe(true);
    expect(colors).toEqual(new Set(["0,0,0", "255,255,255"]));
  });

  it("creates a generally readable Creative Prompt from template data", async () => {
    const outputDirectory = await temporaryDirectory("prompt");
    await exportBase(outputDirectory);
    const prompt = await readFile(path.join(outputDirectory, "artist", "prompt.md"), "utf8");

    expect(prompt).toContain("## Creative Prompt");
    expect(prompt).toContain("1600 × 900");
    expect(prompt).toContain("Türen: 2");
    expect(prompt).toContain("Workspaces: 2");
    expect(prompt).toContain("Interaction Bounds");
    expect(prompt).toContain("Companion-Position");
  });

  it("exposes a generic adapter API and rejects unsupported templates", async () => {
    const outputDirectory = await temporaryDirectory("generic-api");
    await expect(exportArtPack({
      template: { templateKind: "object", templateId: "node.project.v1" },
      composition: coreDefaultBaseComposition,
      functionBindings: coreDefaultBaseFunctionBindings,
      outputDirectory,
    })).rejects.toMatchObject({ code: "unsupported_template" });
  });

  it("rejects a Base template with a missing required slot", async () => {
    const outputDirectory = await temporaryDirectory("missing-slot");
    const incomplete = structuredClone(baseMainRoomTemplate) as unknown as {
      assetSlots: Array<{ slotId: string }>;
    };
    incomplete.assetSlots = incomplete.assetSlots.filter(
      (slot) => slot.slotId !== BASE_SLOT_IDS.leftDoor,
    );

    await expect(exportEnvironmentArtPack({
      template: incomplete,
      composition: coreDefaultBaseComposition,
      functionBindings: coreDefaultBaseFunctionBindings,
      outputDirectory,
    })).rejects.toMatchObject({
      code: "missing_slot",
    } satisfies Partial<EnvironmentArtPackExportError>);
  });

  it("rejects missing surface bounds and missing function bindings clearly", async () => {
    const outputDirectory = await temporaryDirectory("incomplete");
    const incomplete = structuredClone(baseMainRoomTemplate) as unknown as {
      surfaces: Array<Record<string, unknown>>;
    };
    delete incomplete.surfaces[0].shape;
    await expect(exportEnvironmentArtPack({
      template: incomplete,
      composition: coreDefaultBaseComposition,
      functionBindings: coreDefaultBaseFunctionBindings,
      outputDirectory,
    })).rejects.toMatchObject({ code: "missing_surface_bounds" });

    await expect(exportEnvironmentArtPack({
      template: baseMainRoomTemplate,
      composition: coreDefaultBaseComposition,
      functionBindings: coreDefaultBaseFunctionBindings.slice(1),
      outputDirectory,
    })).rejects.toMatchObject({ code: "missing_binding" });
  });

  it("writes only deterministic file names inside the selected target", async () => {
    const parent = await temporaryDirectory("containment");
    const outputDirectory = path.join(parent, "selected-target");
    const sentinel = path.join(parent, "keep.txt");
    await writeFile(sentinel, "unchanged");
    await exportBase(outputDirectory);

    expect(await readFile(sentinel, "utf8")).toBe("unchanged");
    expect((await readdir(parent)).sort()).toEqual(["keep.txt", "selected-target"]);
    const result = await exportBase(outputDirectory);
    expect(result.files.every((file) => {
      const relative = path.relative(path.resolve(outputDirectory), file);
      return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
    })).toBe(true);
  });

  it("does not mutate template, composition, or runtime bindings", async () => {
    const outputDirectory = await temporaryDirectory("immutability");
    const before = JSON.stringify({
      template: baseMainRoomTemplate,
      composition: coreDefaultBaseComposition,
      bindings: coreDefaultBaseFunctionBindings,
    });
    await exportBase(outputDirectory);
    expect(JSON.stringify({
      template: baseMainRoomTemplate,
      composition: coreDefaultBaseComposition,
      bindings: coreDefaultBaseFunctionBindings,
    })).toBe(before);
  });

  it("renders every PNG at the canonical canvas dimensions", async () => {
    const outputDirectory = await temporaryDirectory("png-size");
    await exportBase(outputDirectory);
    for (const fileName of BASE_ART_PACK_FILES.filter((file) => file.endsWith(".png"))) {
      const png = await readFile(path.join(outputDirectory, fileName));
      expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(png.readUInt32BE(16)).toBe(1600);
      expect(png.readUInt32BE(20)).toBe(900);
    }
  });

  it("runs successfully through the public CLI", async () => {
    const outputDirectory = await temporaryDirectory("cli");
    const frontendDirectory = path.resolve(import.meta.dirname, "../..");
    const nodeExecutable = process.execPath;
    const tsxCli = path.join(frontendDirectory, "node_modules", "tsx", "dist", "cli.mjs");
    const script = path.join(frontendDirectory, "scripts", "export-base-template.ts");
    const { stdout } = await execFileAsync(
      nodeExecutable,
      [tsxCli, script, "--output", outputDirectory],
      { cwd: frontendDirectory },
    );

    expect(stdout).toContain(`${BASE_MAIN_ROOM_TEMPLATE_ID}@${baseMainRoomTemplate.version}`);
    expect((await relativeFiles(outputDirectory)).sort()).toEqual([...BASE_ART_PACK_FILES].sort());
  });
});

async function temporaryDirectory(label: string): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), `cosmos-art-pack-${label}-`));
  temporaryDirectories.push(directory);
  return directory;
}

function exportBase(outputDirectory: string) {
  return exportEnvironmentArtPack({
    template: baseMainRoomTemplate,
    composition: coreDefaultBaseComposition,
    functionBindings: coreDefaultBaseFunctionBindings,
    outputDirectory,
  });
}

interface ExportSpec {
  template: {
    templateId: string;
    version: string;
  };
  canvas: {
    width: number;
    height: number;
  };
  slots: Array<{
    stableId: string;
  }>;
  functionalObjects: Array<{
    stableId: string;
    bounds: {
      visual: unknown;
      interaction: unknown;
    };
  }>;
}

async function readSpec(outputDirectory: string): Promise<ExportSpec> {
  return JSON.parse(
    await readFile(path.join(outputDirectory, "base-template-spec.json"), "utf8"),
  ) as ExportSpec;
}

async function relativeFiles(directory: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(path.join(directory, prefix), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const relative = path.posix.join(prefix.replaceAll("\\", "/"), entry.name);
    if (entry.isDirectory()) {
      files.push(...await relativeFiles(directory, relative));
    } else {
      files.push(relative);
    }
  }
  return files;
}

function decodeRgbaPng(buffer: Buffer): {
  width: number;
  height: number;
  pixels: Buffer;
} {
  expect(buffer.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const idatChunks: Buffer[] = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") idatChunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const scanlines = inflateSync(Buffer.concat(idatChunks));
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const sourceOffset = y * (width * 4 + 1);
    expect(scanlines[sourceOffset]).toBe(0);
    scanlines.copy(pixels, y * width * 4, sourceOffset + 1, sourceOffset + 1 + width * 4);
  }
  return { width, height, pixels };
}
