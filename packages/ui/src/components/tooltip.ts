import { el } from "../base/dom";
import { disposable, type Scope } from "../base/disposable";
import { on } from "../base/events";
import { render, type CleanHtml, type TrustedHtml } from "../base/html";

export type TooltipContent =
  | { readonly text: string }
  | { readonly html: TrustedHtml | CleanHtml };
export type TooltipContentSource = TooltipContent | (() => TooltipContent);

export interface TooltipOptions {
  readonly delay?: number;
  readonly placement?: "top" | "right" | "bottom";
}

const DefaultDelay = 1200;
const Offset = 8;
const ViewportPadding = 8;

export function attachTooltip(
  target: HTMLElement,
  content: TooltipContentSource,
  scope: Scope,
  options: TooltipOptions = {}
) {
  let timer: number | undefined;
  let tooltip: HTMLElement | undefined;

  const clearTimer = () => {
    if (timer === undefined) return;
    window.clearTimeout(timer);
    timer = undefined;
  };

  const destroy = () => {
    clearTimer();
    tooltip?.remove();
    tooltip = undefined;
  };

  const show = () => {
    destroy();

    tooltip = el("div", "nb-tooltip");
    tooltip.role = "tooltip";
    const nextContent = typeof content === "function" ? content() : content;
    if ("html" in nextContent) render(tooltip, nextContent.html);
    else tooltip.textContent = nextContent.text;

    const host = target.closest(".nb-workbench") ?? document.body;
    host.append(tooltip);
    positionTooltip(target, tooltip, options.placement ?? "top");
    window.requestAnimationFrame(() => {
      tooltip?.classList.add("is-visible");
    });
  };

  const schedule = () => {
    clearTimer();
    timer = window.setTimeout(show, options.delay ?? DefaultDelay);
  };

  scope.add(on(target, "pointerenter", schedule));
  scope.add(on(target, "pointerleave", destroy));
  scope.add(on(target, "focus", schedule));
  scope.add(on(target, "blur", destroy));
  window.addEventListener("resize", destroy);
  scope.add(disposable(() => window.removeEventListener("resize", destroy)));
  scope.add(disposable(destroy));
}

function positionTooltip(
  target: HTMLElement,
  tooltip: HTMLElement,
  placement: "top" | "right" | "bottom",
) {
  const targetRect = target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const left =
    placement === "right"
      ? Math.min(
          targetRect.right + Offset,
          window.innerWidth - tooltipRect.width - ViewportPadding,
        )
      : clamp(
          targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
          ViewportPadding,
          window.innerWidth - tooltipRect.width - ViewportPadding,
        );
  const top =
    placement === "right"
      ? clamp(
          targetRect.top + targetRect.height / 2 - tooltipRect.height / 2,
          ViewportPadding,
          window.innerHeight - tooltipRect.height - ViewportPadding,
        )
      : placement === "bottom"
      ? Math.min(
          targetRect.bottom + Offset,
          window.innerHeight - tooltipRect.height - ViewportPadding,
        )
      : Math.max(
          ViewportPadding,
          targetRect.top - tooltipRect.height - Offset,
        );

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
