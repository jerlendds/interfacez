import type { Disposable } from "./disposable";
import { write } from "./scheduler";

/// Register one delegated event listener on `root`, calling `fn` for
/// events whose target or ancestor matches `selector`.
export function delegate(
  root: ParentNode,
  type: string,
  selector: string,
  fn: (event: Event, target: Element) => void,
): Disposable {
  const handler = (event: Event) => {
    const start = event.target instanceof Element ? event.target : null;
    const target = start?.closest(selector);
    if (target && root.contains(target)) fn(event, target);
  };

  root.addEventListener(type, handler);
  return { dispose: () => root.removeEventListener(type, handler) };
}

/// Read a client-space pointer from mouse, pointer, or touch events.
export function point(e: PointerEvent | MouseEvent | TouchEvent) {
  const t = "touches" in e ? e.touches[0] || e.changedTouches[0] : e;
  return { x: t.clientX, y: t.clientY };
}

/// Register a directly-bound DOM listener as a disposable.
export function on<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  fn: (event: HTMLElementEventMap[K]) => void,
): Disposable {
  target.addEventListener(type, fn);
  return { dispose: () => target.removeEventListener(type, fn) };
}

export interface DragState {
  start: { x: number; y: number };
  point: { x: number; y: number };
  delta: { x: number; y: number };
}

export interface DragOptions {
  start?: (state: DragState, event: PointerEvent) => void;
  move?: (state: DragState, event: PointerEvent) => void;
  end?: (state: DragState, event: PointerEvent) => void;
}

/// Bind a pointer-captured drag gesture. Move callbacks are batched as
/// writes so drag handlers can update transforms without layout churn.
export function drag(el: HTMLElement, options: DragOptions): Disposable {
  let active: DragState | undefined;
  let lastEvent: PointerEvent | undefined;
  let queued = false;

  const flush = () => {
    queued = false;
    if (active && lastEvent) options.move?.(active, lastEvent);
  };

  const down = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const p = point(event);
    active = { start: p, point: p, delta: { x: 0, y: 0 } };
    el.setPointerCapture(event.pointerId);
    options.start?.(active, event);
  };

  const move = (event: PointerEvent) => {
    if (!active) return;
    const p = point(event);
    active = {
      start: active.start,
      point: p,
      delta: { x: p.x - active.start.x, y: p.y - active.start.y },
    };
    lastEvent = event;
    if (!queued) {
      queued = true;
      write(flush);
    }
  };

  const end = (event: PointerEvent) => {
    if (!active) return;
    const state = active;
    active = undefined;
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId);
    options.end?.(state, event);
  };

  el.addEventListener("pointerdown", down);
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  return {
    dispose() {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
    },
  };
}
