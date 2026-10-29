import { app, BrowserWindow, Menu, ipcMain, net, protocol } from "electron";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execute, query } from "#bus";
import "#file";

const src = fileURLToPath(new URL(".", import.meta.url));

Menu.setApplicationMenu(null);

// the window's chromium takes .ts for a video (MPEG transport stream), so the
// poem serves its own files and strips the types on the way, like node does here
protocol.registerSchemesAsPrivileged([{ scheme: "poema", privileges: { standard: true, secure: true } }]);

ipcMain.handle("execute", (_, command, details) => execute(command, details));
ipcMain.handle("query", (_, name, details) => query(name, details));

app.whenReady().then(() => {
  protocol.handle("poema", async (request) => {
    const file = src + new URL(request.url).pathname;
    if (!file.endsWith(".ts")) return net.fetch(pathToFileURL(file).href);
    const code = stripTypeScriptTypes(await readFile(file, "utf8"));
    return new Response(code, { headers: { "content-type": "text/javascript" } });
  });

  const window = new BrowserWindow({
    width: 900,
    height: 700,
    title: "poema",
    webPreferences: { preload: src + "preload.mts", sandbox: false },
  });
  window.loadURL("poema://app/index.html").then(() => console.log("index.html loaded"));
});

app.on("window-all-closed", () => app.quit());
