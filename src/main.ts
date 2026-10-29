import { app, ipcMain, Menu, net, protocol } from "electron";
import esbuild from "esbuild";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execute, query } from "#bus";
import { editor } from "#windows";
import "#file";
import "#settings";

const src = fileURLToPath(new URL(".", import.meta.url));

Menu.setApplicationMenu(null);

protocol.registerSchemesAsPrivileged([
  { scheme: "poema", privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

ipcMain.handle("execute", (_, command, details) => execute(command, details));
ipcMain.handle("query", (_, name, details) => query(name, details));

// the pages import codemirror and marked from node_modules, which a browser
// can't resolve, so each page script is bundled in memory the first time it's
// asked for, and kept
const bundles = new Map<string, Promise<string>>();

const bundle = (file: string) => {
  let code = bundles.get(file);
  if (!code) {
    code = esbuild
      .build({ entryPoints: [file], bundle: true, write: false, format: "esm", sourcemap: "inline" })
      .then((built) => built.outputFiles[0]!.text);
    bundles.set(file, code);
  }
  return code;
};

app.whenReady().then(() => {
  protocol.handle("poema", async (request) => {
    const file = src + new URL(request.url).pathname.slice(1);
    if (!file.endsWith(".ts")) return net.fetch(pathToFileURL(file).href);
    return new Response(await bundle(file), { headers: { "content-type": "text/javascript" } });
  });

  editor();
});

app.on("window-all-closed", () => app.quit());
