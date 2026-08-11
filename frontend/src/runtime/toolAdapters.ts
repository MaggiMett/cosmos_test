import type { Component } from "vue";

import ArchiveTool from "../components/tools/ArchiveTool.vue";
import CaptureTool from "../components/tools/CaptureTool.vue";
import FilesTool from "../components/tools/FilesTool.vue";
import JourneymanTool from "../components/tools/JourneymanTool.vue";
import ReviewTool from "../components/tools/ReviewTool.vue";
import type { ToolDefinition, ToolRuntimeKind } from "./toolRuntime";

export interface ToolRendererAdapter {
  readonly runtimeKind: ToolRuntimeKind;
  resolve(definition: ToolDefinition): Component | undefined;
}

export class NativeToolRendererAdapter implements ToolRendererAdapter {
  readonly runtimeKind = "native" as const;

  private readonly components: Readonly<Record<string, Component>> = {
    "@cosmos/frontend-runtime:archive": ArchiveTool,
    "@cosmos/frontend-runtime:capture": CaptureTool,
    "@cosmos/frontend-runtime:files": FilesTool,
    "@cosmos/frontend-runtime:journeyman": JourneymanTool,
    "@cosmos/frontend-runtime:review": ReviewTool,
  };

  resolve(definition: ToolDefinition): Component | undefined {
    return this.components[definition.entryPoint];
  }
}

export class ToolRendererRegistry {
  private readonly adapters = new Map<ToolRuntimeKind, ToolRendererAdapter>();

  register(adapter: ToolRendererAdapter): void {
    if (this.adapters.has(adapter.runtimeKind)) {
      throw new Error(`Duplicate Tool renderer for runtime kind: ${adapter.runtimeKind}`);
    }
    this.adapters.set(adapter.runtimeKind, adapter);
  }

  resolve(definition: ToolDefinition): Component | undefined {
    return this.adapters.get(definition.runtimeKind)?.resolve(definition);
  }
}

export function createDefaultToolRendererRegistry(): ToolRendererRegistry {
  const registry = new ToolRendererRegistry();
  registry.register(new NativeToolRendererAdapter());
  return registry;
}
