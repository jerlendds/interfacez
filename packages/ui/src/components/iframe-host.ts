import { el } from "../base/dom";
import type { Component } from "../base/component";

/// Options for a sandboxed iframe-backed pane view.
export interface IframeViewOptions {
  title: string;
  src?: string;
  srcdoc?: string;
  sandbox?: string;
}

/// Create a pane view that hosts extension UI inside an iframe rather
/// than granting direct access to the workbench DOM.
export function iframeView(options: IframeViewOptions): Component {
  return {
    mount(root) {
      const frame = el("iframe", "nb-iframe-view");
      frame.title = options.title;
      frame.sandbox.value = options.sandbox ?? "allow-scripts";
      if (options.src) frame.src = options.src;
      if (options.srcdoc) frame.srcdoc = options.srcdoc;
      root.replaceChildren(frame);
    },
  };
}
