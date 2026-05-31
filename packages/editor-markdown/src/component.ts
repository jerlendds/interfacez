import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type {
  Component,
  ContextMenuAction,
  ContextMenuEvent,
  Scope,
} from "@nodebody/ui";
import { disposable, el, getContextMenuManager } from "@nodebody/ui";
import {
  insertMarkdownLink,
  toggleEmphasis,
  toggleHeading,
  toggleInlineCode,
  toggleStrong,
  toggleTaskListItem,
} from "./commands";
import { markdownEditorExtensions } from "./extensions";
import {
  defaultMarkdownOptions,
  type MarkdownChangeEvent,
  type MarkdownDocumentModel,
  type MarkdownMode,
  type MarkdownOptions,
} from "./options";
import { MarkdownEditorHost, type MarkdownEditorPlugin } from "./plugin";

export interface MarkdownEditorComponentOptions {
  document: MarkdownDocumentModel;
  mode?: MarkdownMode;
  markdown?: MarkdownOptions;
  plugins?: readonly MarkdownEditorPlugin[];
  allowPlugin?: (plugin: MarkdownEditorPlugin) => boolean;
  onChange?: (event: MarkdownChangeEvent) => void;
  onSave?: (
    value: string,
    document: MarkdownDocumentModel,
  ) => void | Promise<void>;
}

export interface MarkdownEditorHandle {
  readonly host: MarkdownEditorHost;
  readonly view: EditorView;
  getText(): string;
  setText(value: string): void;
  focus(): void;
}

export function createMarkdownEditor(
  options: MarkdownEditorComponentOptions,
): Component {
  return {
    mount(root: Element, scope: Scope): void {
      const hostElement = el("section", "nb-md-editor");
      hostElement.dataset.document = options.document.id;
      hostElement.setAttribute("aria-label", options.document.title);
      root.append(hostElement);

      const markdown = options.markdown ?? defaultMarkdownOptions();
      const host = scope.add(
        new MarkdownEditorHost({
          document: options.document,
          options: markdown,
          plugins: options.plugins,
          allowPlugin: options.allowPlugin,
        }),
      );

      const view = new EditorView({
        parent: hostElement,
        state: EditorState.create({
          doc: options.document.initialText,
          extensions: markdownEditorExtensions({
            mode: options.mode ?? "live",
            markdown,
            readOnly: Boolean(options.document.readOnly),
            host,
            onChange: (value) => {
              options.onChange?.({
                document: options.document,
                value,
                reason: "input",
              });
            },
          }),
        }),
      });

      host.attach(view);

      scope.add(disposable(() => view.destroy()));
      scope.add(registerEditorContextMenu(hostElement, host, view, options));

      requestAnimationFrame(() => view.focus());
    },
  };
}

function registerEditorContextMenu(
  element: HTMLElement,
  host: MarkdownEditorHost,
  view: EditorView,
  options: MarkdownEditorComponentOptions,
) {
  const manager = getContextMenuManager();

  return manager.register(element, {
    getActions(event: ContextMenuEvent): readonly ContextMenuAction[] {
      const hasSelection = !view.state.selection.main.empty;
      const modifier = navigator.platform.includes("Mac") ? "Cmd" : "Ctrl";

      return [
        {
          id: "editor.copy",
          label: "Copy",
          accelerator: `${modifier}+C`,
          enabled: hasSelection,
        },
        {
          id: "editor.cut",
          label: "Cut",
          accelerator: `${modifier}+X`,
          enabled: hasSelection && !view.state.readOnly,
        },
        {
          id: "editor.paste",
          label: "Paste",
          accelerator: `${modifier}+V`,
          enabled: !view.state.readOnly,
        },
        { id: "editor.sep.format", type: "separator" },
        {
          id: "editor.bold",
          label: "Bold",
          accelerator: `${modifier}+B`,
          enabled: !view.state.readOnly,
        },
        {
          id: "editor.italic",
          label: "Italic",
          accelerator: `${modifier}+I`,
          enabled: !view.state.readOnly,
        },
        {
          id: "editor.inlineCode",
          label: "Inline code",
          enabled: !view.state.readOnly,
        },
        {
          id: "editor.link",
          label: "Insert link",
          accelerator: `${modifier}+K`,
          enabled: !view.state.readOnly,
        },
        {
          id: "editor.task",
          label: "Toggle task",
          accelerator: `${modifier}+Enter`,
          enabled: !view.state.readOnly,
        },
        {
          id: "editor.save",
          label: "Save",
          accelerator: `${modifier}+S`,
          enabled: Boolean(options.onSave),
        },
        ...host.contextMenuActions(event),
      ];
    },

    async runAction(actionId: string, event: ContextMenuEvent): Promise<void> {
      if (await host.runContextMenuAction(actionId, event)) return;

      switch (actionId) {
        case "editor.copy":
          document.execCommand("copy");
          return;
        case "editor.cut":
          document.execCommand("cut");
          return;
        case "editor.paste":
          document.execCommand("paste");
          return;
        case "editor.bold":
          toggleStrong(view);
          return;
        case "editor.italic":
          toggleEmphasis(view);
          return;
        case "editor.inlineCode":
          toggleInlineCode(view);
          return;
        case "editor.link":
          insertMarkdownLink(view);
          return;
        case "editor.task":
          toggleTaskListItem(view);
          return;
        case "editor.h1":
          toggleHeading(1)(view);
          return;
        case "editor.h2":
          toggleHeading(2)(view);
          return;
        case "editor.h3":
          toggleHeading(3)(view);
          return;
        case "editor.save":
          await options.onSave?.(view.state.doc.toString(), options.document);
          return;
      }
    },
  });
}
