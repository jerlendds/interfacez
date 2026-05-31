import type { Extension, Range } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

export interface WysiwymOptions {
  hideSyntaxOnInactiveLines: boolean;
  renderTaskCheckboxes: boolean;
  revealSyntaxOnSelection: boolean;
}

const defaultOptions: WysiwymOptions = {
  hideSyntaxOnInactiveLines: true,
  renderTaskCheckboxes: true,
  revealSyntaxOnSelection: true,
};

export function markdownWysiwym(
  options: Partial<WysiwymOptions> = {},
): Extension {
  const config = { ...defaultOptions, ...options };

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(private readonly view: EditorView) {
        this.decorations = buildDecorations(view, config);
      }

      update(update: ViewUpdate): void {
        if (
          update.docChanged ||
          update.selectionSet ||
          update.viewportChanged ||
          update.geometryChanged
        ) {
          this.decorations = buildDecorations(update.view, config);
        }
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    },
  );
}

function buildDecorations(
  view: EditorView,
  options: WysiwymOptions,
): DecorationSet {
  const ranges: Range<Decoration>[] = [];
  const activeLines = collectActiveLines(view);

  decorateVisibleLines(view, activeLines, options, ranges);
  decorateSyntaxTree(view, activeLines, options, ranges);

  return Decoration.set(ranges, true);
}

function collectActiveLines(view: EditorView): Set<number> {
  const lines = new Set<number>();

  for (const range of view.state.selection.ranges) {
    const start = view.state.doc.lineAt(range.from);
    const end = view.state.doc.lineAt(range.to);

    for (let line = start.number; line <= end.number; line += 1) {
      lines.add(line);
    }
  }

  return lines;
}

function decorateVisibleLines(
  view: EditorView,
  activeLines: Set<number>,
  options: WysiwymOptions,
  ranges: Range<Decoration>[],
): void {
  for (const visible of view.visibleRanges) {
    let line = view.state.doc.lineAt(visible.from);

    while (line.from <= visible.to) {
      const text = line.text;
      const active = activeLines.has(line.number);
      const tableRow = !active ? parseTableRow(text) : undefined;

      decorateLineClass(line.from, text, active, ranges);

      if (tableRow) {
        if (tableRow.separator) {
          decorateCollapsedTableSeparator(line.from, line.to, ranges);
        } else {
          decorateRenderedTableRow(line.from, line.to, tableRow, ranges);
        }
      } else if (!active && options.hideSyntaxOnInactiveLines) {
        hideLineSyntax(view, line.from, text, ranges);

        decorateRenderedBlocks(line.from, text, ranges);

        if (options.renderTaskCheckboxes) {
          decorateTaskCheckbox(line.from, text, ranges);
        }
      }

      if (line.to >= visible.to || line.number >= view.state.doc.lines) break;
      line = view.state.doc.line(line.number + 1);
    }
  }
}

function decorateLineClass(
  lineFrom: number,
  text: string,
  active: boolean,
  ranges: Range<Decoration>[],
): void {
  const heading = /^(#{1,6})(?:\s+|$)/.exec(text);

  if (heading) {
    const level = heading[1].length;
    ranges.push(
      Decoration.line({
        class: `cm-nb-md-line cm-nb-md-heading cm-nb-md-heading-${level}`,
      }).range(lineFrom),
    );
    return;
  }

  const quote = /^(\s*(?:>\s*)+)/.exec(text);
  if (quote) {
    const level = countQuoteLevel(quote[1]);
    ranges.push(
      Decoration.line({
        class: `cm-nb-md-line cm-nb-md-blockquote cm-nb-md-blockquote-${Math.min(
          level,
          6,
        )}`,
        attributes: { style: `--nb-md-quote-level: ${level}` },
      }).range(lineFrom),
    );
    return;
  }

  if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(text)) {
    ranges.push(
      Decoration.line({
        class: "cm-nb-md-line cm-nb-md-hr",
      }).range(lineFrom),
    );
    return;
  }

  if (/^\s*\|.+\|\s*$/.test(text)) {
    const tableRow = !active ? parseTableRow(text) : undefined;
    ranges.push(
      Decoration.line({
        class:
          tableRow?.separator === true
            ? "cm-nb-md-line cm-nb-md-table cm-nb-md-table-separator-rendered"
            : active
              ? "cm-nb-md-line cm-nb-md-table cm-nb-md-table-source"
              : "cm-nb-md-line cm-nb-md-table cm-nb-md-table-rendered",
      }).range(lineFrom),
    );
  }
}

function hideLineSyntax(
  view: EditorView,
  lineFrom: number,
  text: string,
  ranges: Range<Decoration>[],
): void {
  const hide = Decoration.replace({ class: "cm-nb-md-hidden-syntax" });

  const heading = /^(#{1,6})(\s+)/.exec(text);
  if (heading) {
    ranges.push(
      hide.range(lineFrom, lineFrom + heading[1].length + heading[2].length),
    );
  }

  const quote = /^(\s*(?:>\s*)+)/.exec(text);
  if (quote) {
    ranges.push(hide.range(lineFrom, lineFrom + quote[1].length));
  }

  decorateInlineRegex(
    text,
    lineFrom,
    /\*\*([^*\n]+)\*\*/g,
    [
      [0, 2],
      [-2, 0],
    ],
    ranges,
  );

  decorateInlineRegex(
    text,
    lineFrom,
    /(^|[^*])\*([^*\n]+)\*(?!\*)/g,
    [
      [1, 2],
      [-1, 0],
    ],
    ranges,
  );

  decorateInlineRegex(
    text,
    lineFrom,
    /~~([^~\n]+)~~/g,
    [
      [0, 2],
      [-2, 0],
    ],
    ranges,
  );

  decorateInlineRegex(
    text,
    lineFrom,
    /`([^`\n]+)`/g,
    [
      [0, 1],
      [-1, 0],
    ],
    ranges,
  );

  decorateLinks(text, lineFrom, ranges);
}

function decorateRenderedBlocks(
  lineFrom: number,
  text: string,
  ranges: Range<Decoration>[],
): void {
  decorateQuoteBars(lineFrom, text, ranges);
  decorateHorizontalRule(lineFrom, text, ranges);
}

function decorateQuoteBars(
  lineFrom: number,
  text: string,
  ranges: Range<Decoration>[],
): void {
  const quote = /^(\s*(?:>\s*)+)/.exec(text);
  if (!quote) return;

  const level = countQuoteLevel(quote[1]);
  ranges.push(
    Decoration.widget({
      widget: new QuoteBarsWidget(level),
      side: -1,
    }).range(lineFrom),
  );
}

function countQuoteLevel(markers: string): number {
  return [...markers].filter((char) => char === ">").length;
}

interface TableRowRenderModel {
  cells: string[];
  separator: boolean;
}

function decorateRenderedTableRow(
  lineFrom: number,
  lineTo: number,
  row: TableRowRenderModel,
  ranges: Range<Decoration>[],
): void {
  ranges.push(
    Decoration.replace({
      widget: new TableRowWidget(row.cells, row.separator, lineFrom),
      inclusive: false,
    }).range(lineFrom, Math.max(lineFrom, lineTo)),
  );
}

function decorateCollapsedTableSeparator(
  lineFrom: number,
  lineTo: number,
  ranges: Range<Decoration>[],
): void {
  ranges.push(
    Decoration.replace({
      widget: new CollapsedTableSeparatorWidget(),
      inclusive: false,
    }).range(lineFrom, Math.max(lineFrom, lineTo)),
  );
}

function parseTableRow(text: string): TableRowRenderModel | undefined {
  if (!isTableRow(text)) return undefined;

  const cells = splitTableCells(text).map((cell) => cell.trim());
  if (cells.length === 0) return undefined;

  return {
    cells,
    separator: cells.every(isTableSeparatorCell),
  };
}

function splitTableCells(text: string): string[] {
  const cells: string[] = [];
  let start = 0;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char !== "|") continue;

    cells.push(text.slice(start, index).replaceAll("\\|", "|"));
    start = index + 1;
  }

  cells.push(text.slice(start).replaceAll("\\|", "|"));

  if (cells[0]?.trim() === "") cells.shift();
  if (cells[cells.length - 1]?.trim() === "") cells.pop();

  return cells;
}

function isTableRow(text: string): boolean {
  const pipes = collectTablePipeIndexes(text);
  return pipes.length >= 2 && /^\s*\|/.test(text) && /\|\s*$/.test(text);
}

function collectTablePipeIndexes(text: string): number[] {
  const indexes: number[] = [];

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== "|") continue;
    if (index > 0 && text[index - 1] === "\\") continue;
    indexes.push(index);
  }

  return indexes;
}

function isTableSeparatorCell(text: string): boolean {
  return /^\s*:?-{3,}:?\s*$/.test(text);
}

function decorateHorizontalRule(
  lineFrom: number,
  text: string,
  ranges: Range<Decoration>[],
): void {
  if (!/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(text)) return;

  ranges.push(
    Decoration.replace({
      widget: new HorizontalRuleWidget(),
      block: false,
      inclusive: false,
    }).range(lineFrom, lineFrom + text.length),
  );
}

function decorateInlineRegex(
  text: string,
  lineFrom: number,
  regex: RegExp,
  markerSlices: readonly (readonly [startOffset: number, endOffset: number])[],
  ranges: Range<Decoration>[],
): void {
  const hide = Decoration.replace({ class: "cm-nb-md-hidden-syntax" });

  for (const match of text.matchAll(regex)) {
    if (match.index == null) continue;

    const from = lineFrom + match.index;
    const to = from + match[0].length;

    for (const [startOffset, endOffset] of markerSlices) {
      const markerFrom =
        startOffset >= 0 ? from + startOffset : to + startOffset;
      const markerTo = endOffset > 0 ? from + endOffset : to + endOffset;
      if (markerFrom < markerTo) ranges.push(hide.range(markerFrom, markerTo));
    }
  }
}

function decorateLinks(
  text: string,
  lineFrom: number,
  ranges: Range<Decoration>[],
): void {
  const hide = Decoration.replace({ class: "cm-nb-md-hidden-syntax" });
  const linkText = Decoration.mark({ class: "cm-nb-md-link-text" });
  const link = /!?\[([^\]\n]+)\]\(([^)\n]+)\)/g;

  for (const match of text.matchAll(link)) {
    if (match.index == null) continue;

    const fullFrom = lineFrom + match.index;
    const image = match[0].startsWith("!");
    const labelFrom = fullFrom + (image ? 2 : 1);
    const labelTo = labelFrom + match[1].length;
    const closeBracket = labelTo;
    const destinationFrom = closeBracket + 1;
    const fullTo = fullFrom + match[0].length;

    ranges.push(linkText.range(labelFrom, labelTo));
    ranges.push(hide.range(fullFrom, labelFrom));
    ranges.push(hide.range(closeBracket, fullTo));

    if (image) {
      ranges.push(
        Decoration.widget({
          widget: new ImageBadgeWidget(match[2]),
          side: 1,
        }).range(destinationFrom),
      );
    }
  }
}

function decorateTaskCheckbox(
  lineFrom: number,
  text: string,
  ranges: Range<Decoration>[],
): void {
  const task = /^(\s*(?:[-+*]|\d+[.)])\s+)\[([ xX])\]/.exec(text);
  if (!task) return;

  const from = lineFrom + task[1].length;
  const checkPos = from + 1;
  const checked = task[2].toLowerCase() === "x";

  ranges.push(
    Decoration.replace({
      widget: new TaskCheckboxWidget(checked, checkPos),
      inclusive: false,
    }).range(from, from + 3),
  );
}

function decorateSyntaxTree(
  view: EditorView,
  activeLines: Set<number>,
  options: WysiwymOptions,
  ranges: Range<Decoration>[],
): void {
  const hide = Decoration.replace({ class: "cm-nb-md-hidden-syntax" });
  const inlineCode = Decoration.mark({ class: "cm-nb-md-inline-code" });
  const emphasis = Decoration.mark({ class: "cm-nb-md-emphasis" });
  const strong = Decoration.mark({ class: "cm-nb-md-strong" });
  const strike = Decoration.mark({ class: "cm-nb-md-strike" });

  for (const visible of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from: visible.from,
      to: visible.to,
      enter(node) {
        const name = node.name;
        const active = activeLines.has(view.state.doc.lineAt(node.from).number);

        if (name === "FencedCode" || name === "CodeBlock") {
          decorateLinesInRange(
            view,
            node.from,
            node.to,
            "cm-nb-md-line cm-nb-md-codeblock",
            ranges,
          );
        }

        if (name === "InlineCode") {
          ranges.push(inlineCode.range(node.from, node.to));
        } else if (name === "Emphasis") {
          ranges.push(emphasis.range(node.from, node.to));
        } else if (name === "StrongEmphasis") {
          ranges.push(strong.range(node.from, node.to));
        } else if (name === "Strikethrough") {
          ranges.push(strike.range(node.from, node.to));
        }

        if (!options.hideSyntaxOnInactiveLines || active) return;

        if (
          name.endsWith("Mark") ||
          name === "HeaderMark" ||
          name === "CodeMark" ||
          name === "LinkMark"
        ) {
          ranges.push(hide.range(node.from, node.to));
        }
      },
    });
  }
}

function decorateLinesInRange(
  view: EditorView,
  from: number,
  to: number,
  className: string,
  ranges: Range<Decoration>[],
): void {
  let line = view.state.doc.lineAt(from);

  while (line.from <= to) {
    ranges.push(Decoration.line({ class: className }).range(line.from));
    if (line.number >= view.state.doc.lines) break;
    line = view.state.doc.line(line.number + 1);
  }
}

class QuoteBarsWidget extends WidgetType {
  constructor(private readonly level: number) {
    super();
  }

  eq(other: QuoteBarsWidget): boolean {
    return other.level === this.level;
  }

  toDOM(): HTMLElement {
    const bars = document.createElement("span");
    bars.className = "cm-nb-md-quote-bars";
    bars.setAttribute("aria-hidden", "true");

    for (let index = 0; index < this.level; index += 1) {
      const bar = document.createElement("span");
      bar.className = "cm-nb-md-quote-bar";
      bars.append(bar);
    }

    return bars;
  }
}

class TableRowWidget extends WidgetType {
  constructor(
    private readonly cells: readonly string[],
    private readonly separator: boolean,
    private readonly lineFrom: number,
  ) {
    super();
  }

  eq(other: TableRowWidget): boolean {
    return (
      other.separator === this.separator &&
      other.lineFrom === this.lineFrom &&
      other.cells.length === this.cells.length &&
      other.cells.every((cell, index) => cell === this.cells[index])
    );
  }

  toDOM(view: EditorView): HTMLElement {
    const lineNumber = view.state.doc.lineAt(this.lineFrom).number;
    const row = document.createElement("span");
    row.className = `cm-nb-md-table-row cm-nb-md-table-row-${Math.min(
      this.cells.length,
      6,
    )}${this.separator ? " cm-nb-md-table-separator-row" : ""}`;
    row.style.gridTemplateColumns = tableGridTemplate(this.cells.length);
    row.dataset.tableLine = String(lineNumber);

    for (const [index, text] of this.cells.entries()) {
      const cell = document.createElement("span");
      cell.className = "cm-nb-md-table-cell";
      cell.contentEditable = "true";
      cell.spellcheck = true;
      cell.dataset.tableLine = String(lineNumber);
      cell.dataset.tableCell = String(index);
      cell.textContent = this.separator ? "" : text;
      cell.setAttribute("role", "textbox");
      cell.setAttribute("aria-label", `Table cell ${index + 1}`);
      cell.addEventListener("mousedown", (event) => {
        event.stopPropagation();
      });
      cell.addEventListener("click", (event) => {
        event.stopPropagation();
      });
      cell.addEventListener("blur", () => {
        commitTableCell(view, this.lineFrom, index, cell.textContent ?? "");
      });
      cell.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          cell.blur();
          return;
        }

        if (event.key !== "Tab") return;

        event.preventDefault();
        commitTableCell(view, this.lineFrom, index, cell.textContent ?? "");
        moveTableCellFocus(view, this.lineFrom, index, event.shiftKey);
      });
      row.append(cell);
    }

    return row;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

function tableGridTemplate(columns: number): string {
  if (columns <= 1) return "minmax(0, 1fr)";
  if (columns === 2) return "repeat(2, minmax(0, 1fr))";

  return `minmax(7.5rem, 0.55fr) repeat(${columns - 1}, minmax(0, 1.45fr))`;
}

function commitTableCell(
  view: EditorView,
  lineFrom: number,
  cellIndex: number,
  value: string,
): void {
  const line = view.state.doc.lineAt(Math.min(lineFrom, view.state.doc.length));
  const row = parseTableRow(line.text);
  if (!row || row.separator || row.cells[cellIndex] == null) return;

  const nextCells = row.cells.slice();
  nextCells[cellIndex] = normalizeTableCellText(value);
  const nextLine = renderTableRow(nextCells);

  if (nextLine === line.text) return;

  view.dispatch({
    changes: { from: line.from, to: line.to, insert: nextLine },
  });
}

function normalizeTableCellText(value: string): string {
  return value.replace(/\s+/g, " ").trim().replaceAll("|", "\\|");
}

function renderTableRow(cells: readonly string[]): string {
  return `| ${cells.join(" | ")} |`;
}

function moveTableCellFocus(
  view: EditorView,
  lineFrom: number,
  cellIndex: number,
  backwards: boolean,
): void {
  const doc = view.state.doc;
  const line = doc.lineAt(Math.min(lineFrom, doc.length));
  const row = parseTableRow(line.text);
  if (!row || row.separator) return;

  if (backwards) {
    const target = previousTableCell(view, line.number, cellIndex);
    if (target) focusRenderedTableCell(target.lineNumber, target.cellIndex);
    return;
  }

  if (cellIndex + 1 < row.cells.length) {
    focusRenderedTableCell(line.number, cellIndex + 1);
    return;
  }

  const target = nextTableCell(view, line.number);
  if (target) {
    focusRenderedTableCell(target.lineNumber, target.cellIndex);
    return;
  }

  insertLineAfterTable(view, line.number);
}

function previousTableCell(
  view: EditorView,
  lineNumber: number,
  cellIndex: number,
): { lineNumber: number; cellIndex: number } | undefined {
  if (cellIndex > 0) return { lineNumber, cellIndex: cellIndex - 1 };

  for (let index = lineNumber - 1; index >= 1; index -= 1) {
    const line = view.state.doc.line(index);
    const row = parseTableRow(line.text);
    if (!row) return undefined;
    if (row.separator) continue;
    return { lineNumber: index, cellIndex: Math.max(0, row.cells.length - 1) };
  }

  return undefined;
}

function nextTableCell(
  view: EditorView,
  lineNumber: number,
): { lineNumber: number; cellIndex: number } | undefined {
  for (let index = lineNumber + 1; index <= view.state.doc.lines; index += 1) {
    const line = view.state.doc.line(index);
    const row = parseTableRow(line.text);
    if (!row) return undefined;
    if (row.separator) continue;
    return { lineNumber: index, cellIndex: 0 };
  }

  return undefined;
}

function focusRenderedTableCell(lineNumber: number, cellIndex: number): void {
  requestAnimationFrame(() => {
    const selector = `.cm-nb-md-table-cell[data-table-line="${lineNumber}"][data-table-cell="${cellIndex}"]`;
    const cell = document.querySelector<HTMLElement>(selector);
    if (!cell) return;

    cell.focus();
    selectElementText(cell);
  });
}

function selectElementText(element: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(element);
  selection.removeAllRanges();
  selection.addRange(range);
}

function insertLineAfterTable(view: EditorView, lineNumber: number): void {
  let lastTableLine = lineNumber;

  for (let index = lineNumber + 1; index <= view.state.doc.lines; index += 1) {
    const line = view.state.doc.line(index);
    if (!parseTableRow(line.text)) break;
    lastTableLine = index;
  }

  const line = view.state.doc.line(lastTableLine);
  view.dispatch({
    changes: { from: line.to, insert: "\n" },
    selection: { anchor: line.to + 1 },
    scrollIntoView: true,
  });
  view.focus();
}

class CollapsedTableSeparatorWidget extends WidgetType {
  toDOM(): HTMLElement {
    const spacer = document.createElement("span");
    spacer.className = "cm-nb-md-table-separator-spacer";
    spacer.setAttribute("aria-hidden", "true");
    return spacer;
  }

  ignoreEvent(): boolean {
    return true;
  }
}

class HorizontalRuleWidget extends WidgetType {
  toDOM(): HTMLElement {
    const rule = document.createElement("span");
    rule.className = "cm-nb-md-hr-rule";
    rule.setAttribute("aria-hidden", "true");
    return rule;
  }
}

class TaskCheckboxWidget extends WidgetType {
  constructor(
    private readonly checked: boolean,
    private readonly checkPos: number,
  ) {
    super();
  }

  eq(other: TaskCheckboxWidget): boolean {
    return other.checked === this.checked && other.checkPos === this.checkPos;
  }

  toDOM(view: EditorView): HTMLElement {
    const label = document.createElement("label");
    label.className = "cm-nb-md-task";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = this.checked;
    input.setAttribute(
      "aria-label",
      this.checked ? "Mark incomplete" : "Mark complete",
    );

    input.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });

    input.addEventListener("change", () => {
      view.dispatch({
        changes: {
          from: this.checkPos,
          to: this.checkPos + 1,
          insert: input.checked ? "x" : " ",
        },
      });
      view.focus();
    });

    label.append(input);
    return label;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

class ImageBadgeWidget extends WidgetType {
  constructor(private readonly destination: string) {
    super();
  }

  eq(other: ImageBadgeWidget): boolean {
    return other.destination === this.destination;
  }

  toDOM(): HTMLElement {
    const badge = document.createElement("span");
    badge.className = "cm-nb-md-image-badge";
    badge.textContent = "image";
    badge.title = this.destination;
    return badge;
  }
}
