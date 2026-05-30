import type { Disposable } from "./disposable";

/// A callback notified when a signal's value changes.
export type Subscriber = () => void;

/// A small explicit reactive cell. Subscribers are called once when
/// registered and again after each distinct value change.
export interface Signal<T> {
  get(): T;
  set(next: T): void;
  update(fn: (value: T) => T): void;
  subscribe(sub: Subscriber): Disposable;
}

/// Create a signal with explicit read, write, update, and subscribe
/// operations.
export function signal<T>(value: T): Signal<T> {
  const subs = new Set<Subscriber>();

  return {
    get: () => value,
    set(next) {
      if (Object.is(value, next)) return;
      value = next;
      for (const sub of subs) sub();
    },
    update(fn) {
      this.set(fn(value));
    },
    subscribe(sub) {
      subs.add(sub);
      sub();
      return { dispose: () => void subs.delete(sub) };
    },
  };
}
