import { Scope } from "./disposable";

/// Initializes behavior for freshly swapped route content.
export type RouteInit = (root: Element, scope: Scope) => void;

/// A partial-page router that aborts stale navigations and disposes
/// the previous route scope before mounting the next one.
export class Router {
  private current?: Scope;
  private abort?: AbortController;

  constructor(
    private root: Element,
    private initialise: RouteInit,
  ) {}

  /// Navigate to `path`, fetching its partial HTML representation.
  async go(path: string) {
    this.abort?.abort();
    const abort = new AbortController();
    this.abort = abort;

    const response = await fetch(`${path}?xhr=1`, { signal: abort.signal });
    const html = await response.text();
    if (abort.signal.aborted) return;

    this.current?.dispose();
    this.current = new Scope();

    const swap = () => {
      this.root.innerHTML = html;
    };
    document.startViewTransition?.(swap) ?? swap();
    history.pushState({}, "", path);
    this.initialise(this.root, this.current);
  }

  /// Abort any pending navigation and dispose the active route.
  dispose() {
    this.abort?.abort();
    this.current?.dispose();
  }
}
