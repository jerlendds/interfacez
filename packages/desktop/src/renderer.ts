import "./assets/index.css";
import "@nodebody/ui/index.css";
import "@nodebody/editor-markdown/markdown-editor.css";
import { configureContextMenuManager, mount } from "@nodebody/ui";
import {
  createMarkdownEditor,
  gfmMarkdownOptions,
} from "@nodebody/editor-markdown";
import { createDesktopContextMenuBridge } from "./components/context-menu";
import { workbench } from "./components/workbench";

const root = document.querySelector("#app");

if (!root) throw new Error("Missing #app root");

configureContextMenuManager({
  root: document,
  bridge: createDesktopContextMenuBridge(),
});
mount(
  workbench({
    panes: [
      {
        id: "main",
        tabs: [
          {
            id: "readme",
            title: "readme.md",
            resource: "file://readme.md",
            active: true,
            view: createMarkdownEditor({
              document: {
                id: "readme.md",
                title: "readme.md",
                initialText:
                  "# Nodebody\n\n- [ ] Ship WYSIWYM editor\n\nUse **markdown** directly.",
              },
              mode: "live",
              markdown: gfmMarkdownOptions(),
              onChange(event) {
                console.debug(
                  "markdown changed",
                  event.document.id,
                  event.value.length,
                );
              },
            }),
          },
        ],
      },
    ],
  }),
  root,
);
