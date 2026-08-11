export type WindowRole =
  | "base_environment"
  | "room_environment"
  | "workspace_environment"
  | "tool"
  | "surface";

export type WindowState = "active" | "inactive" | "closed";

export interface WindowCapabilities {
  movable: boolean;
  resizable: boolean;
  closable: boolean;
  borderless: boolean;
  header: boolean;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowDefinition {
  objectId: string;
  role: WindowRole;
  title: string;
  bounds: WindowBounds;
  minimumSize?: Readonly<{ width: number; height: number }>;
  parentWindowId?: string;
}

export interface WindowInstance extends WindowDefinition {
  capabilities: Readonly<WindowCapabilities>;
  state: WindowState;
  focusOrder: number;
}

export class WindowRuntimeError extends Error {
  constructor(
    readonly code:
      | "duplicate_window"
      | "invalid_bounds"
      | "missing_parent"
      | "unsupported_capability"
      | "unknown_window",
    message: string,
  ) {
    super(message);
    this.name = "WindowRuntimeError";
  }
}

const CAPABILITIES: Readonly<Record<WindowRole, Readonly<WindowCapabilities>>> = {
  base_environment: {
    movable: false,
    resizable: false,
    closable: true,
    borderless: true,
    header: false,
  },
  room_environment: {
    movable: false,
    resizable: false,
    closable: true,
    borderless: true,
    header: false,
  },
  workspace_environment: {
    movable: false,
    resizable: false,
    closable: true,
    borderless: false,
    header: true,
  },
  tool: {
    movable: true,
    resizable: true,
    closable: true,
    borderless: false,
    header: true,
  },
  surface: {
    movable: false,
    resizable: false,
    closable: true,
    borderless: true,
    header: false,
  },
};

export function capabilitiesFor(role: WindowRole): Readonly<WindowCapabilities> {
  return CAPABILITIES[role];
}

export class WindowRuntime {
  private readonly windows = new Map<string, WindowInstance>();
  private nextFocusOrder = 0;

  open(definition: WindowDefinition): Readonly<WindowInstance> {
    if (this.windows.has(definition.objectId)) {
      throw new WindowRuntimeError("duplicate_window", `Window is already open: ${definition.objectId}`);
    }
    validateDefinition(definition);
    this.requireParent(definition);

    const instance: WindowInstance = {
      ...definition,
      bounds: this.constrainBounds(definition, definition.bounds),
      minimumSize: definition.minimumSize ? { ...definition.minimumSize } : undefined,
      capabilities: capabilitiesFor(definition.role),
      state: "inactive",
      focusOrder: 0,
    };
    this.windows.set(instance.objectId, instance);
    return this.focus(instance.objectId);
  }

  focus(objectId: string): Readonly<WindowInstance> {
    const selected = this.requireWindow(objectId);
    for (const window of this.windows.values()) {
      window.state = window.objectId === objectId ? "active" : "inactive";
    }
    selected.focusOrder = ++this.nextFocusOrder;
    return snapshot(selected);
  }

  move(objectId: string, position: Readonly<{ x: number; y: number }>): Readonly<WindowInstance> {
    const window = this.requireWindow(objectId);
    this.requireCapability(window, "movable");
    window.bounds = this.constrainBounds(window, { ...window.bounds, ...position });
    return snapshot(window);
  }

  resize(objectId: string, size: Readonly<{ width: number; height: number }>): Readonly<WindowInstance> {
    const window = this.requireWindow(objectId);
    this.requireCapability(window, "resizable");
    window.bounds = this.constrainBounds(window, { ...window.bounds, ...size });
    return snapshot(window);
  }

  close(objectId: string): Readonly<WindowInstance> {
    const window = this.requireWindow(objectId);
    this.requireCapability(window, "closable");

    for (const child of [...this.windows.values()]) {
      if (child.parentWindowId === objectId) this.close(child.objectId);
    }

    window.state = "closed";
    this.windows.delete(objectId);
    this.focusTopWindow();
    return snapshot(window);
  }

  get(objectId: string): Readonly<WindowInstance> {
    return snapshot(this.requireWindow(objectId));
  }

  list(): readonly Readonly<WindowInstance>[] {
    return [...this.windows.values()]
      .sort((left, right) => left.focusOrder - right.focusOrder)
      .map(snapshot);
  }

  private requireWindow(objectId: string): WindowInstance {
    const window = this.windows.get(objectId);
    if (!window) {
      throw new WindowRuntimeError("unknown_window", `Unknown open Window: ${objectId}`);
    }
    return window;
  }

  private requireParent(definition: WindowDefinition): void {
    if (definition.role === "surface" && !definition.parentWindowId) {
      throw new WindowRuntimeError("missing_parent", "Surface Windows require a parent Window.");
    }
    if (definition.parentWindowId && !this.windows.has(definition.parentWindowId)) {
      throw new WindowRuntimeError(
        "missing_parent",
        `Parent Window is not open: ${definition.parentWindowId}`,
      );
    }
  }

  private requireCapability(
    window: WindowInstance,
    capability: "movable" | "resizable" | "closable",
  ): void {
    if (!window.capabilities[capability]) {
      throw new WindowRuntimeError(
        "unsupported_capability",
        `${window.role} Windows are not ${capability} in Version 1.`,
      );
    }
  }

  private constrainBounds(definition: WindowDefinition, requested: WindowBounds): WindowBounds {
    validateBounds(requested, definition.minimumSize);
    if (!definition.parentWindowId || definition.role !== "tool") return { ...requested };

    const parent = this.requireWindow(definition.parentWindowId);
    const minimum = definition.minimumSize ?? { width: 1, height: 1 };
    if (parent.bounds.width < minimum.width || parent.bounds.height < minimum.height) {
      throw new WindowRuntimeError("invalid_bounds", "Tool Window minimum size exceeds its parent.");
    }

    const width = Math.min(requested.width, parent.bounds.width);
    const height = Math.min(requested.height, parent.bounds.height);
    const maximumX = parent.bounds.x + parent.bounds.width - width;
    const maximumY = parent.bounds.y + parent.bounds.height - height;
    return {
      x: clamp(requested.x, parent.bounds.x, maximumX),
      y: clamp(requested.y, parent.bounds.y, maximumY),
      width,
      height,
    };
  }

  private focusTopWindow(): void {
    const top = [...this.windows.values()].sort((left, right) => right.focusOrder - left.focusOrder)[0];
    if (top) this.focus(top.objectId);
  }
}

function validateDefinition(definition: WindowDefinition): void {
  if (!definition.objectId.trim() || !definition.title.trim()) {
    throw new WindowRuntimeError("invalid_bounds", "Window identity and title are required.");
  }
  validateBounds(definition.bounds, definition.minimumSize);
}

function validateBounds(
  bounds: WindowBounds,
  minimumSize: Readonly<{ width: number; height: number }> | undefined,
): void {
  const values = [bounds.x, bounds.y, bounds.width, bounds.height];
  if (values.some((value) => !Number.isFinite(value)) || bounds.width <= 0 || bounds.height <= 0) {
    throw new WindowRuntimeError("invalid_bounds", "Window bounds must be finite and positive.");
  }
  if (
    minimumSize &&
    (minimumSize.width <= 0 ||
      minimumSize.height <= 0 ||
      bounds.width < minimumSize.width ||
      bounds.height < minimumSize.height)
  ) {
    throw new WindowRuntimeError("invalid_bounds", "Window bounds must satisfy its minimum usable size.");
  }
}

function snapshot(window: WindowInstance): Readonly<WindowInstance> {
  return {
    ...window,
    bounds: { ...window.bounds },
    minimumSize: window.minimumSize ? { ...window.minimumSize } : undefined,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
