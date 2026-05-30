export type ComponentTheme = {
  toolbarHeight: string;
  tabHeight: string;
  statusbarHeight: string;
  sidebarWidth: string;
  background: string;
  surface: string;
  toolbar: string;
  sidebar: string;
  tabbar: string;
  activeTab: string;
  statusbar: string;
  border: string;
  foreground: string;
  muted: string;
  accent: string;
  accentSoft: string;
};

export type ComponentThemeInput = Partial<ComponentTheme>;

/// Apply theme values as CSS variables on the workbench root.
export function applyComponentTheme(
  root: HTMLElement,
  theme?: ComponentThemeInput,
) {
  for (const [key, value] of Object.entries(theme ?? {})) {
    if (value == null) continue;
    root.style.setProperty(`--nb-${toKebab(key)}`, value);
  }
}

function toKebab(value: string) {
  return value.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}
