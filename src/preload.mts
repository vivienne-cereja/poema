import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("poema", {
  execute: (command: string, details: unknown) => ipcRenderer.invoke("execute", command, details),
  query: (name: string, details: unknown) => ipcRenderer.invoke("query", name, details),
});
