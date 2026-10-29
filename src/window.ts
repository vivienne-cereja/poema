import type { execute, query } from "#bus";

declare global {
  interface Window {
    poema: { execute: typeof execute, query: typeof query };
  }
}

const page = document.querySelector("textarea")!;
let path: string | undefined;

addEventListener("keydown", async (key) => {
  if (!key.ctrlKey) return;

  if (key.key === "o") {
    key.preventDefault();
    const opened = await window.poema.query("open", {});
    if (opened.was !== "answered") return;
    path = opened.answer.path;
    page.value = opened.answer.text;
    document.title = path;
  }

  if (key.key === "s") {
    key.preventDefault();
    const saved = await window.poema.execute("save", { path, text: page.value });
    if (saved.was !== "done") return;
    path = saved.result.path;
    document.title = path;
  }
});
