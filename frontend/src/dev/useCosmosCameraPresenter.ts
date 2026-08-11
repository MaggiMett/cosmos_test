import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  type ComputedRef,
} from "vue";

import type { CosmosMapRuntime, MapCamera } from "../runtime/cosmosMapRuntime";

export interface CameraDrag {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startCameraX: number;
  startCameraY: number;
}

export function useCosmosCameraPresenter(
  runtime: CosmosMapRuntime,
  projectId: ComputedRef<string | null> | null = null,
) {
  const viewportElement = ref<HTMLElement | null>(null);
  const viewport = reactive({
    width: typeof window === "undefined" ? 1600 : window.innerWidth,
    height: typeof window === "undefined" ? 1000 : window.innerHeight,
  });
  const cameraDrag = ref<CameraDrag | null>(null);
  let resizeObserver: ResizeObserver | null = null;
  let cameraSaveTimer: ReturnType<typeof setTimeout> | null = null;

  const worldStyle = computed(() => {
    const camera = runtime.state.snapshot?.camera ?? { x: 0, y: 0, zoom: 1 };
    return cameraWorldStyle(camera, viewport);
  });

  function startPan(event: PointerEvent): void {
    const camera = runtime.state.snapshot?.camera;
    if (event.button !== 0 || !camera || isInteractiveTarget(event.target)) return;
    event.preventDefault();
    viewportElement.value?.setPointerCapture(event.pointerId);
    cameraDrag.value = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startCameraX: camera.x,
      startCameraY: camera.y,
    };
  }

  function continuePan(event: PointerEvent): boolean {
    const drag = cameraDrag.value;
    const camera = runtime.state.snapshot?.camera;
    if (!drag || drag.pointerId !== event.pointerId || !camera) return false;
    runtime.setCamera(cameraAfterPan(camera, drag, event));
    return true;
  }

  function finishPan(event: PointerEvent): boolean {
    const drag = cameraDrag.value;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    cameraDrag.value = null;
    releasePointer(event.pointerId);
    scheduleCameraSave();
    return true;
  }

  function cancelPan(event: PointerEvent): boolean {
    const drag = cameraDrag.value;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    cameraDrag.value = null;
    releasePointer(event.pointerId);
    return true;
  }

  function zoomAtPointer(event: WheelEvent): void {
    const camera = runtime.state.snapshot?.camera;
    const element = viewportElement.value;
    if (!camera || !element) return;
    const rect = element.getBoundingClientRect();
    runtime.setCamera(cameraAfterZoomAtPointer(camera, rect, event));
    scheduleCameraSave();
  }

  function zoomBy(factor: number): void {
    const camera = runtime.state.snapshot?.camera;
    if (!camera) return;
    runtime.setCamera({ ...camera, zoom: clampZoom(camera.zoom * factor) });
    scheduleCameraSave();
  }

  function fit(): void {
    const activeProjectId = projectId?.value ?? null;
    if (!fitCosmosCamera(runtime, activeProjectId, viewport)) return;
    scheduleCameraSave();
  }

  function focusProject(activeProjectId: string): void {
    runtime.focusProject(activeProjectId, viewport);
    scheduleCameraSave();
  }

  function scheduleCameraSave(): void {
    if (cameraSaveTimer) clearTimeout(cameraSaveTimer);
    cameraSaveTimer = setTimeout(() => {
      cameraSaveTimer = null;
      void runtime.persistCamera().catch(() => undefined);
    }, 260);
  }

  function persistCameraNow(): Promise<void> {
    if (cameraSaveTimer) {
      clearTimeout(cameraSaveTimer);
      cameraSaveTimer = null;
    }
    return runtime.persistCamera();
  }

  function releasePointer(pointerId: number): void {
    if (viewportElement.value?.hasPointerCapture(pointerId)) {
      viewportElement.value.releasePointerCapture(pointerId);
    }
  }

  onMounted(() => {
    const element = viewportElement.value;
    if (!element) return;
    resizeObserver = new ResizeObserver(([entry]) => {
      viewport.width = entry.contentRect.width;
      viewport.height = entry.contentRect.height;
    });
    resizeObserver.observe(element);
  });

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    if (cameraSaveTimer) clearTimeout(cameraSaveTimer);
  });

  return {
    viewport,
    viewportElement,
    worldStyle,
    isPanning: computed(() => cameraDrag.value !== null),
    startPan,
    continuePan,
    finishPan,
    cancelPan,
    zoomAtPointer,
    zoomBy,
    fit,
    focusProject,
    persistCameraNow,
  } as const;
}

export function cameraAfterPan(
  camera: Readonly<MapCamera>,
  drag: Readonly<CameraDrag>,
  pointer: Readonly<{ clientX: number; clientY: number }>,
): MapCamera {
  return {
    x: drag.startCameraX - (pointer.clientX - drag.startClientX) / camera.zoom,
    y: drag.startCameraY - (pointer.clientY - drag.startClientY) / camera.zoom,
    zoom: camera.zoom,
  };
}

export function cameraWorldStyle(
  camera: Readonly<MapCamera>,
  viewport: Readonly<{ width: number; height: number }>,
): Readonly<{ transform: string }> {
  return {
    transform: `translate(${viewport.width / 2 - camera.x * camera.zoom}px, ${viewport.height / 2 - camera.y * camera.zoom}px) scale(${camera.zoom})`,
  };
}

export function cameraAfterZoomAtPointer(
  camera: Readonly<MapCamera>,
  viewport: Readonly<{ left: number; top: number; width: number; height: number }>,
  pointer: Readonly<{ clientX: number; clientY: number; deltaY: number }>,
): MapCamera {
  const cursorX = pointer.clientX - viewport.left - viewport.width / 2;
  const cursorY = pointer.clientY - viewport.top - viewport.height / 2;
  const worldX = camera.x + cursorX / camera.zoom;
  const worldY = camera.y + cursorY / camera.zoom;
  const zoom = clampZoom(camera.zoom * Math.exp(-pointer.deltaY * 0.0012));
  return {
    x: worldX - cursorX / zoom,
    y: worldY - cursorY / zoom,
    zoom,
  };
}

export function fitCosmosCamera(
  runtime: Readonly<Pick<CosmosMapRuntime, "state" | "focusProject" | "focusCosmos">>,
  projectId: string | null,
  viewport: Readonly<{ width: number; height: number }>,
): boolean {
  if (projectId) {
    if (!runtime.state.snapshot?.projects.some((project) => project.objectId === projectId)) return false;
    runtime.focusProject(projectId, viewport);
  } else {
    runtime.focusCosmos(viewport);
  }
  return true;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("button, input, textarea, select, a, [data-camera-static]"));
}

function clampZoom(value: number): number {
  return Math.min(2.4, Math.max(0.35, value));
}
