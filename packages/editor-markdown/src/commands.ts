import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

export type CodeMirrorCommand = (view: EditorView) => boolean;

export const toggleStrong: CodeMirrorCommand = (view) =>
  wrapSelection(view, "**");

export const toggleEmphasis: CodeMirrorCommand = (view) =>
  wrapSelection(view, "*");

export const toggleInlineCode: CodeMirrorCommand = (view) =>
  wrapSelection(view, "`");

export const insertMarkdownLink: CodeMirrorCommand = (view) => {
  const { state } = view;

  view.dispatch(
    state.changeByRange((range) => {
      const selected = state.sliceDoc(range.from, range.to);
      const label = selected || "link";
      const inserted = `[${label}](url)`;
      const from = range.from;
      const to = range.to;

      const anchorFrom = from + 1;
      const anchorTo = anchorFrom + label.length;
      const urlFrom = from + inserted.length - 4;
      const urlTo = from + inserted.length - 1;

      return {
        changes: { from, to, insert: inserted },
        range: selected
          ? EditorSelection.range(urlFrom, urlTo)
          : EditorSelection.range(anchorFrom, anchorTo),
      };
    }),
    { scrollIntoView: true },
  );

  return true;
};

export function toggleHeading(level: 1 | 2 | 3 | 4 | 5 | 6): CodeMirrorCommand {
  return (view) => {
    const { state } = view;
    const prefix = `${"#".repeat(level)} `;

    view.dispatch(
      state.changeByRange((range) => {
        const line = state.doc.lineAt(range.from);
        const existing = /^(#{1,6})\s+/.exec(line.text);

        if (existing?.[0] === prefix) {
          return {
            changes: {
              from: line.from,
              to: line.from + existing[0].length,
              insert: "",
            },
            range: EditorSelection.cursor(
              Math.max(line.from, range.head - existing[0].length),
            ),
          };
        }

        if (existing) {
          const delta = prefix.length - existing[0].length;
          return {
            changes: {
              from: line.from,
              to: line.from + existing[0].length,
              insert: prefix,
            },
            range: EditorSelection.cursor(range.head + delta),
          };
        }

        return {
          changes: { from: line.from, insert: prefix },
          range: EditorSelection.cursor(range.head + prefix.length),
        };
      }),
      { scrollIntoView: true },
    );

    return true;
  };
}

export const toggleTaskListItem: CodeMirrorCommand = (view) => {
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.head);
  const task = /^(\s*(?:[-+*]|\d+[.)])\s+\[)([ xX])(\]\s*)/.exec(line.text);

  if (task) {
    const checkPos = line.from + task[1].length;
    const checked = task[2].toLowerCase() === "x";

    view.dispatch({
      changes: {
        from: checkPos,
        to: checkPos + 1,
        insert: checked ? " " : "x",
      },
      scrollIntoView: true,
    });

    return true;
  }

  view.dispatch({
    changes: { from: line.from, insert: "- [ ] " },
    selection: { anchor: state.selection.main.head + 6 },
    scrollIntoView: true,
  });

  return true;
};

function wrapSelection(view: EditorView, marker: string): boolean {
  const { state } = view;

  view.dispatch(
    state.changeByRange((range) => {
      const selected = state.sliceDoc(range.from, range.to);
      const before = state.sliceDoc(
        Math.max(0, range.from - marker.length),
        range.from,
      );
      const after = state.sliceDoc(
        range.to,
        Math.min(state.doc.length, range.to + marker.length),
      );

      if (selected && before === marker && after === marker) {
        return {
          changes: [
            { from: range.to, to: range.to + marker.length, insert: "" },
            {
              from: range.from - marker.length,
              to: range.from,
              insert: "",
            },
          ],
          range: EditorSelection.range(
            range.from - marker.length,
            range.to - marker.length,
          ),
        };
      }

      return {
        changes: [
          { from: range.to, insert: marker },
          { from: range.from, insert: marker },
        ],
        range: EditorSelection.range(
          range.from + marker.length,
          range.to + marker.length,
        ),
      };
    }),
    { scrollIntoView: true },
  );

  return true;
}
