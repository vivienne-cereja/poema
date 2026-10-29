import { app, ipcMain, Menu, net, protocol } from "electron";
import esbuild from "esbuild";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execute, query } from "#bus";
import { editor, manual } from "#windows";
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

app.whenReady().then(async () => {
  protocol.handle("poema", async (request) => {
    const file = src + new URL(request.url).pathname.slice(1);
    if (!file.endsWith(".ts")) return net.fetch(pathToFileURL(file).href);
    return new Response(await bundle(file), { headers: { "content-type": "text/javascript" } });
  });

  // poema <file>: packaged, the files start after the binary; from the source,
  // after `electron .`. flags belong to chromium, not to the poem, and can come
  // before the app's own path, so they go first
  const files = process.argv.filter((arg) => !arg.startsWith("-")).slice(app.isPackaged ? 1 : 2);
  if (files.length) {
    for (const file of files) editor(resolve(file));
    return;
  }

  // the first time the poem opens without a file, it opens on its manual
  const settings = await query("settings", {});
  if (settings.was === "answered" && !settings.answer.welcomed) {
    manual();
    await execute("settings", { welcomed: true });
  } else {
    editor();
  }
});

app.on("window-all-closed", () => app.quit());
