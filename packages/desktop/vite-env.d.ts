/// <reference types="./forge.env.d.ts" />

declare module "*.css";

interface VersionsApi {
  chrome: () => string;
}

interface WindowApi {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

interface OsApi {
  selectFolder?: () => Promise<string | undefined>;
}

interface Window {
  os: OsApi;
  win: WindowApi;
  versions: VersionsApi;
}
