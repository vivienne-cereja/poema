import { dialog } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import { answered, answers, done, handles } from "#bus";

declare module "#bus" {
  interface Queries {
    open: { details: Record<never, never>, answer: { path: string, text: string }, refusal: "cancelled" };
  }
  interface Commands {
    save: { details: { path?: string, text: string }, result: { path: string }, refusal: "cancelled" };
  }
}

const markdown = [{ name: "markdown", extensions: ["md"] }];

answers("open", async () => {
  const chosen = await dialog.showOpenDialog({ filters: markdown, properties: ["openFile"] });
  const path = chosen.filePaths[0];
  if (chosen.canceled || !path) return { query: "open", was: "refused", reason: "cancelled" };
  return answered("open", { path, text: await readFile(path, "utf8") });
});

handles("save", async ({ path, text }) => {
  const where = path ?? (await dialog.showSaveDialog({ filters: markdown })).filePath;
  if (!where) return { command: "save", was: "refused", reason: "cancelled" };
  await writeFile(where, text);
  return done("save", { path: where });
});
