export type MarkdownMode = "source" | "live" | "preview";

export interface MarkdownConstructs {
  attention: boolean;
  autolink: boolean;
  blockQuote: boolean;
  characterEscape: boolean;
  characterReference: boolean;
  codeIndented: boolean;
  codeFenced: boolean;
  codeText: boolean;
  definition: boolean;
  frontmatter: boolean;
  gfmAutolinkLiteral: boolean;
  gfmFootnoteDefinition: boolean;
  gfmLabelStartFootnote: boolean;
  gfmStrikethrough: boolean;
  gfmTable: boolean;
  gfmTaskListItem: boolean;
  hardBreakEscape: boolean;
  hardBreakTrailing: boolean;
  headingAtx: boolean;
  headingSetext: boolean;
  htmlFlow: boolean;
  htmlText: boolean;
  labelStartImage: boolean;
  labelStartLink: boolean;
  labelEnd: boolean;
  listItem: boolean;
  mathFlow: boolean;
  mathText: boolean;
  mdxEsm: boolean;
  mdxExpressionFlow: boolean;
  mdxExpressionText: boolean;
  mdxJsxFlow: boolean;
  mdxJsxText: boolean;
  thematicBreak: boolean;
}

export interface MarkdownParseOptions {
  constructs: MarkdownConstructs;
  gfmStrikethroughSingleTilde: boolean;
  mathTextSingleDollar: boolean;
}

export interface MarkdownCompileOptions {
  allowDangerousHtml: boolean;
  allowDangerousProtocol: boolean;
  gfmTagfilter: boolean;
}

export interface MarkdownOptions {
  parse: MarkdownParseOptions;
  compile: MarkdownCompileOptions;
}

export interface MarkdownDocumentModel {
  id: string;
  title: string;
  resource?: string;
  initialText: string;
  readOnly?: boolean;
}

export interface MarkdownChangeEvent {
  document: MarkdownDocumentModel;
  value: string;
  reason: "input" | "programmatic";
}

export function commonmarkConstructs(): MarkdownConstructs {
  return {
    attention: true,
    autolink: true,
    blockQuote: true,
    characterEscape: true,
    characterReference: true,
    codeIndented: true,
    codeFenced: true,
    codeText: true,
    definition: true,
    frontmatter: false,
    gfmAutolinkLiteral: false,
    gfmFootnoteDefinition: false,
    gfmLabelStartFootnote: false,
    gfmStrikethrough: false,
    gfmTable: false,
    gfmTaskListItem: false,
    hardBreakEscape: true,
    hardBreakTrailing: true,
    headingAtx: true,
    headingSetext: true,
    htmlFlow: true,
    htmlText: true,
    labelStartImage: true,
    labelStartLink: true,
    labelEnd: true,
    listItem: true,
    mathFlow: false,
    mathText: false,
    mdxEsm: false,
    mdxExpressionFlow: false,
    mdxExpressionText: false,
    mdxJsxFlow: false,
    mdxJsxText: false,
    thematicBreak: true,
  };
}

export function gfmConstructs(): MarkdownConstructs {
  return {
    ...commonmarkConstructs(),
    gfmAutolinkLiteral: true,
    gfmFootnoteDefinition: true,
    gfmLabelStartFootnote: true,
    gfmStrikethrough: true,
    gfmTable: true,
    gfmTaskListItem: true,
  };
}

export function mdxConstructs(): MarkdownConstructs {
  return {
    ...commonmarkConstructs(),
    autolink: false,
    codeIndented: false,
    htmlFlow: false,
    htmlText: false,
    mdxEsm: true,
    mdxExpressionFlow: true,
    mdxExpressionText: true,
    mdxJsxFlow: true,
    mdxJsxText: true,
  };
}

export function defaultMarkdownOptions(): MarkdownOptions {
  return {
    parse: {
      constructs: commonmarkConstructs(),
      gfmStrikethroughSingleTilde: true,
      mathTextSingleDollar: true,
    },
    compile: {
      allowDangerousHtml: false,
      allowDangerousProtocol: false,
      gfmTagfilter: false,
    },
  };
}

export function gfmMarkdownOptions(): MarkdownOptions {
  return {
    parse: {
      constructs: gfmConstructs(),
      gfmStrikethroughSingleTilde: true,
      mathTextSingleDollar: true,
    },
    compile: {
      allowDangerousHtml: false,
      allowDangerousProtocol: false,
      gfmTagfilter: true,
    },
  };
}
