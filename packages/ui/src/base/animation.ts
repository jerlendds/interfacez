import type { Disposable, Scope } from "./disposable";

export type FrameCallback = (
  progress: number,
  delta: number,
  cancel: () => void,
) => void;

export interface FrameAnimation extends Disposable {
  readonly finished: Promise<void>;
}

/// Run a Web Animations API animation and optionally bind it to a
/// scope so route, pane, or component teardown cancels it.
export async function animate(
  el: Element,
  keyframes: Keyframe[],
  options: KeyframeAnimationOptions,
  scope?: Scope,
) {
  const player = el.animate(keyframes, { fill: "both", ...options });
  scope?.add({ dispose: () => player.cancel() });

  try {
    await player.finished;
    player.commitStyles?.();
  } catch {
    // Cancellation is normal during route, tab, and pane teardown.
  } finally {
    player.cancel();
  }
}

/// Run callback-driven animation work on requestAnimationFrame. Without a
/// duration, `progress` is elapsed milliseconds; with one, it is 0..1.
export function frameLoop(
  callback: FrameCallback,
  duration?: number,
  scope?: Scope,
): FrameAnimation {
  if (duration === 0) {
    callback(1, 0, () => undefined);
    return { finished: Promise.resolve(), dispose() {} };
  }

  let frame = 0;
  let running = true;
  let last = performance.now();
  const start = last;
  let resolve!: () => void;
  const finished = new Promise<void>((done) => {
    resolve = done;
  });

  const dispose = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(frame);
    resolve();
  };

  function tick(now: number) {
    if (!running) return;
    const elapsed = now - start;
    const progress = duration ? Math.min(1, elapsed / duration) : elapsed;
    callback(progress, now - last, dispose);
    last = now;
    if (duration && elapsed >= duration) dispose();
    else frame = requestAnimationFrame(tick);
  }

  frame = requestAnimationFrame(tick);
  const animation = { finished, dispose };
  scope?.add(animation);
  return animation;
}

/// Apply a common easing curve to a 0..1 progress value.
export function ease(type: "linear" | "quad" | "cubic" | "sine", t: number) {
  if (type === "linear") return t;
  if (type === "quad") return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  if (type === "cubic") return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
  return 0.5 - Math.cos(t * Math.PI) / 2;
}
