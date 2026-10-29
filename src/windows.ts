import { BrowserWindow, ipcMain, type WebContents } from "electron";
import { fileURLToPath } from "node:url";
import { done, handles } from "#bus";

declare module "#bus" {
  interface Commands {
    "new-window": { details: Record<never, never>, result: Record<never, never>, refusal: never };
  }
}

const preload = fileURLToPath(new URL("./preload.mts", import.meta.url));

const open = (page: string) => {
  const window = new BrowserWindow({
    width: 1000,
    height: 760,
    backgroundColor: "#fbfaf7",
    webPreferences: { preload, sandbox: false },
  });
  window.loadURL(`poema://app/${page}`);
  return window;
};

export const editor = () => open("index.html");

handles("new-window", async () => {
  editor();
  return done("new-window", {});
});

// a rendered window belongs to the editor that opened it: it follows that
// editor's text and closes with it. these talk to one window, not to the
// poem, so they go straight over ipc instead of through the bus.

type Shown = { text: string, title: string };

const rendered = new Map<WebContents, BrowserWindow>();
const latest = new Map<WebContents, Shown>();

ipcMain.handle("render-apart", ({ sender }) => {
  const already = rendered.get(sender);
  if (already) return already.focus();

  const window = open("rendered.html");
  rendered.set(sender, window);
  window.on("closed", () => rendered.delete(sender));
  window.webContents.on("did-finish-load", () => {
    const shown = latest.get(sender);
    if (shown) window.webContents.send("text", shown);
  });
  sender.once("destroyed", () => {
    latest.delete(sender);
    if (!window.isDestroyed()) window.close();
  });
});

ipcMain.on("show", ({ sender }, text: string, title: string) => {
  latest.set(sender, { text, title });
  rendered.get(sender)?.webContents.send("text", { text, title });
});
