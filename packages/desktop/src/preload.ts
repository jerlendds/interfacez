import { contextBridge, ipcRenderer } from "electron";

/// custom titlebar bridge
contextBridge.exposeInMainWorld("win", {
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
});

/// metadata
contextBridge.exposeInMainWorld("versions", {
  chrome: () => process.versions.chrome,
});

contextBridge.exposeInMainWorld("os", {
  selectFolder: () => ipcRenderer.invoke("os:selectFolder"),
});
