import { disposable, Scope } from "./disposable";
import { signal } from "./signal";
import { write } from "./scheduler";

/// Narrow browser capability facts that UI code can branch on without
/// doing ad hoc feature checks in every component.
export const platform = {
  mobile: matchMedia("(pointer: coarse)").matches,
  retina: devicePixelRatio > 1,
  dark: matchMedia("(prefers-color-scheme: dark)"),
  storage: localStorage,
};

export const viewport = signal({
  width: window.innerWidth,
  height: window.innerHeight,
});

let viewportQueued = false;

/// Refresh the shared viewport signal at most once per animation frame.
export function refreshViewport() {
  if (viewportQueued) return;
  viewportQueued = true;
  write(() => {
    viewportQueued = false;
    viewport.set({ width: window.innerWidth, height: window.innerHeight });
  });
}

window.addEventListener("resize", refreshViewport, { passive: true });
window.visualViewport?.addEventListener("resize", refreshViewport, {
  passive: true,
});

/// Observe element resize changes and bind the observer lifetime to a
/// scope.
export function observeResize(
  scope: Scope,
  el: Element,
  fn: (entry: ResizeObserverEntry) => void,
) {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) fn(entry);
  });
  observer.observe(el);
  return scope.add(disposable(() => observer.disconnect()));
}
