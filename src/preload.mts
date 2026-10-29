import { contextBridge, ipcRenderer, webFrame } from "electron";

contextBridge.exposeInMainWorld("poema", {
  execute: (command: string, details: unknown) => ipcRenderer.invoke("execute", command, details),
  query: (name: string, details: unknown) => ipcRenderer.invoke("query", name, details),
  on: (channel: string, listener: (value: unknown) => void) => {
    ipcRenderer.on(channel, (_, value) => listener(value));
  },
  zoom: (level: number) => webFrame.setZoomLevel(level),
  renderApart: () => ipcRenderer.invoke("render-apart"),
  show: (text: string, title: string) => ipcRenderer.send("show", text, title),
});
