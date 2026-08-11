export type TransitionKind = "environment" | "navigation" | "theme" | "window";

export interface TransitionRequest<T> {
  kind: TransitionKind;
  targetId: string;
  run: () => T | Promise<T>;
}

export class TransitionRuntime {
  private tail: Promise<unknown> = Promise.resolve();
  private activeRequest: Readonly<Pick<TransitionRequest<unknown>, "kind" | "targetId">> | null = null;

  get active(): Readonly<Pick<TransitionRequest<unknown>, "kind" | "targetId">> | null {
    return this.activeRequest;
  }

  enqueue<T>(request: TransitionRequest<T>): Promise<T> {
    const execute = async (): Promise<T> => {
      this.activeRequest = { kind: request.kind, targetId: request.targetId };
      try {
        return await request.run();
      } finally {
        this.activeRequest = null;
      }
    };

    const result = this.tail.then(execute, execute);
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async settled(): Promise<void> {
    await this.tail;
  }
}
