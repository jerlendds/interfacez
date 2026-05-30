import DOMPurify, { type Config } from "dompurify";

/// Application-owned HTML. Do not use with user, network, markdown,
/// log, file name, or extension/plugin content.
export type TrustedHtml = string & { readonly __trustedHtml: unique symbol };

/// Sanitized HTML.
export type CleanHtml = string & { readonly __cleanHtml: unique symbol };

/// Values that can be interpolated into an HTML template.
export type HtmlValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | TrustedHtml
  | CleanHtml
  | readonly HtmlValue[];

const MaxHtmlLength = 100_000;

const PurifyConfig: Config = {
  USE_PROFILES: { html: true },

  ALLOWED_TAGS: [
    "a",
    "abbr",
    "b",
    "blockquote",
    "br",
    "button",
    "code",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "kbd",
    "li",
    "main",
    "ol",
    "p",
    "pre",
    "s",
    "section",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul",
  ],

  ALLOWED_ATTR: [
    "aria-label",
    "aria-hidden",
    "aria-expanded",
    "aria-controls",
    "aria-selected",
    "aria-current",
    "aria-disabled",
    "class",
    "data-action",
    "data-id",
    "data-kind",
    "disabled",
    "draggable",
    "href",
    "id",
    "role",
    "tabindex",
    "title",
    "type",
  ],

  ALLOW_DATA_ATTR: true,

  FORBID_TAGS: [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "svg",
    "math",
    "form",
    "input",
    "textarea",
    "select",
    "option",
    "link",
    "meta",
  ],

  FORBID_ATTR: [
    "style",
    "src",
    "srcset",
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "onfocus",
    "oninput",
    "onchange",
    "onsubmit",
  ],
};

/// Build trusted, unsanitized application-owned HTML.
export function html(
  strings: TemplateStringsArray,
  ...values: readonly HtmlValue[]
): TrustedHtml {
  return join(strings, values) as TrustedHtml;
}

/// Build sanitized HTML.
export function htmlc(
  strings: TemplateStringsArray,
  ...values: readonly HtmlValue[]
): CleanHtml {
  return cleanHtml(join(strings, values));
}

/// Sanitize raw HTML.
export function cleanHtml(value: string): CleanHtml {
  return DOMPurify.sanitize(limit(value), PurifyConfig) as unknown as CleanHtml;
}

/// Mark a string as trusted application-owned HTML.
export function trustedHtml(value: string): TrustedHtml {
  return value as TrustedHtml;
}

/// Write HTML into an element.
export function render(
  target: Element,
  template: TrustedHtml | CleanHtml
): void {
  target.innerHTML = template;
}

/// Append HTML to an element.
export function appendHtml(
  target: Element,
  value: TrustedHtml | CleanHtml
): void {
  target.insertAdjacentHTML("beforeend", value);
}

/// Write text into a node.
export function renderText(target: Node, value: unknown): void {
  target.textContent = value == null ? "" : String(value);
}

function join(
  strings: TemplateStringsArray,
  values: readonly HtmlValue[]
): string {
  let result = "";

  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) result += valueToHtml(values[i]);
  }

  return result;
}

function valueToHtml(value: HtmlValue): string {
  if (Array.isArray(value)) return value.map(valueToHtml).join("");
  if (value == null || value === false) return "";
  return String(value);
}

function limit(value: string): string {
  return value.length > MaxHtmlLength ? value.slice(0, MaxHtmlLength) : value;
}
