import { app, BrowserWindow } from "electron";
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { answered, answers, done, handles } from "#bus";

export type Settings = {
  editorFont: string,
  renderedFont: string,
  codeFont: string,
  lineHeight: number,
  zoom: number,
  welcomed: boolean,
};

declare module "#bus" {
  interface Queries {
    settings: { details: Record<never, never>, answer: Settings, refusal: never };
    fonts: { details: Record<never, never>, answer: string[], refusal: never };
  }
  interface Commands {
    settings: { details: Partial<Settings>, result: Settings, refusal: never };
  }
}

const defaults: Settings = {
  editorFont: "Iosevka Aile",
  renderedFont: "IBM Plex Serif",
  codeFont: "Fira Code",
  lineHeight: 1.6,
  zoom: 0,
  welcomed: false,
};

let current: Settings | undefined;

// everything the poem remembers between openings lives in one file, in the poem's own config folder
const load = async (): Promise<Settings> => current ??= {
  ...defaults,
  ...JSON.parse(await readFile(app.getPath("userData") + "/settings.json", "utf8").catch(() => "{}")),
};

answers("settings", async () => answered("settings", await load()));

handles("settings", async (change) => {
  current = { ...(await load()), ...change };
  await writeFile(app.getPath("userData") + "/settings.json", JSON.stringify(current, null, 2));
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send("settings", current);
  return done("settings", current);
});

answers("fonts", async () => {
  const { stdout } = await promisify(execFile)("fc-list", [":", "family"]);
  const families = new Set(stdout.split("\n").map((line) => line.split(",")[0]!.trim()).filter(Boolean));
  return answered("fonts", [...families].sort());
});
