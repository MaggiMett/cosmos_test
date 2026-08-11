import { computed, shallowRef, watch, type ComputedRef, type ShallowRef } from "vue";
import { useRoute } from "vue-router";
import type { TemplateRegistry } from "../../theme-engine";
import { themeBuilderProjectApi } from "../../runtime/themeBuilderProjectApi";
import { ThemeBuilderSession, type ThemeBuilderSessionSnapshot } from "./themeBuilderSession";

export type BuilderLoadPhase = "empty" | "loading" | "error" | "success";

export interface ThemeBuilderSessionController {
  readonly projectId: ComputedRef<string>;
  readonly phase: ShallowRef<BuilderLoadPhase>;
  readonly loadError: ShallowRef<string>;
  readonly snapshot: ShallowRef<Readonly<ThemeBuilderSessionSnapshot> | undefined>;
  readonly session: () => ThemeBuilderSession | undefined;
  reload(): Promise<void>;
  save(): Promise<void>;
  undo(): void;
  redo(): void;
  sync(): void;
}

export function useThemeBuilderSession(templates?: TemplateRegistry): ThemeBuilderSessionController {
  const route = useRoute();
  const projectId = computed(() => typeof route.query.builderProjectId === "string" ? route.query.builderProjectId.trim() : "");
  const phase = shallowRef<BuilderLoadPhase>("empty");
  const loadError = shallowRef("");
  const snapshot = shallowRef<Readonly<ThemeBuilderSessionSnapshot>>();
  let current: ThemeBuilderSession | undefined;

  async function reload(): Promise<void> {
    current = undefined;
    snapshot.value = undefined;
    loadError.value = "";
    if (!projectId.value) {
      phase.value = "empty";
      return;
    }
    phase.value = "loading";
    const result = await themeBuilderProjectApi.get(projectId.value);
    if (!result.ok) {
      loadError.value = result.error.message;
      phase.value = "error";
      return;
    }
    current = new ThemeBuilderSession(result.data, templates);
    sync();
    phase.value = "success";
  }

  function sync(): void {
    if (current) snapshot.value = current.snapshot;
  }

  async function save(): Promise<void> {
    if (!current) return;
    const pending = current.save(themeBuilderProjectApi);
    sync();
    await pending;
    sync();
  }
  function undo(): void { current?.undo(); sync(); }
  function redo(): void { current?.redo(); sync(); }

  watch(projectId, reload, { immediate: true });
  return { projectId, phase, loadError, snapshot, session: () => current, reload, save, undo, redo, sync };
}
