import type { Component } from "../base/component";
import type { TrustedHtml } from "../base/html";
import type { ComponentThemeInput } from "./theme";

/// A tab for a resource-backed workspace pane.
export interface TabModel {
  id: string;
  title: string;
  resource: string;
  active?: boolean;
  view?: Component;
}

/// A leaf pane with a tab strip and optional mounted view.
export interface PaneModel {
  id: string;
  tabs: TabModel[];
}
