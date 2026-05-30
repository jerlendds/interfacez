/// A value that owns resources and can release them deterministically.
export interface Disposable {
  dispose(): void;
}

/// A disposable collection used to tie listeners, observers,
/// subscriptions, timers, and animations to a component lifetime.
export class Scope implements Disposable {
  private items: Disposable[] = [];
  private disposed = false;

  /// Add a disposable to this scope. When the scope has already been
  /// disposed, the item is disposed immediately.
  add<T extends Disposable>(item: T): T {
    if (this.disposed) item.dispose();
    else this.items.push(item);
    return item;
  }

  /// Dispose all owned resources in reverse registration order.
  dispose(): void {
    this.disposed = true;
    for (const item of this.items.splice(0).reverse()) item.dispose();
  }
}

/// Wrap a cleanup callback in the common disposable shape.
export function disposable(fn: () => void): Disposable {
  return { dispose: fn };
}
