import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  BASE_MAIN_ROOM_TEMPLATE_ID,
  baseMainRoomTemplate,
} from "../src/theme-engine/baseTemplate";
import {
  coreDefaultBaseComposition,
  coreDefaultBaseFunctionBindings,
} from "../src/theme-engine/coreDefaultBaseSkin";
import { exportEnvironmentArtPack } from "./theme-art-exporter";

export async function runBaseTemplateExportCli(argv = process.argv.slice(2)): Promise<void> {
  const outputDirectory = readOutputDirectory(argv);
  const result = await exportEnvironmentArtPack({
    template: baseMainRoomTemplate,
    composition: coreDefaultBaseComposition,
    functionBindings: coreDefaultBaseFunctionBindings,
    outputDirectory,
  });
  process.stdout.write(
    `Exported ${result.templateId}@${result.templateVersion} to ${result.outputDirectory}\n`
      + result.files.map((file) =>
        `- ${path.relative(result.outputDirectory, file).replaceAll(path.sep, "/")}`
      ).join("\n")
      + "\n",
  );
}

function readOutputDirectory(argv: readonly string[]): string {
  if (argv.length === 0) {
    return path.resolve(process.cwd(), "theme-art-packs", BASE_MAIN_ROOM_TEMPLATE_ID);
  }
  if (argv.length === 2 && argv[0] === "--output" && argv[1].trim() !== "") {
    return path.resolve(argv[1]);
  }
  throw new Error("Usage: pnpm theme:export-base-template [--output <directory>]");
}

const isDirectExecution = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  runBaseTemplateExportCli().catch((error: unknown) => {
    process.stderr.write(`Base template export failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
