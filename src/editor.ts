import { defaultKeymap, deleteLine, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { bracketMatching, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import { drawSelection, dropCursor, EditorView, keymap } from "@codemirror/view";
import { classHighlighter } from "@lezer/highlight";
import { bold, italic } from "./format.ts";
import { live } from "./live.ts";
import { current, dress } from "./look.ts";
import { tables } from "./tables.ts";
import { toHtml, whenLanguageArrives } from "./render.ts";

const rendered = document.querySelector<HTMLElement>("#rendered")!;
const settings = document.querySelector<HTMLDialogElement>("#settings")!;

let path: string | undefined;
let dirty = false;
let waiting: number | undefined;

const name = () => path?.split("/").pop() ?? "untitled";

const retitle = () => {
  document.title = `${name()}${dirty ? " •" : ""}`;
};

const draw = () => {
  const text = view.state.doc.toString();
  if (!rendered.hidden) rendered.innerHTML = toHtml(text);
  window.poema.show(text, name());
};

// rendering waits for a pause in the typing, so a long text never renders on every key
const soon = () => {
  window.clearTimeout(waiting);
  waiting = window.setTimeout(draw, 150);
};

const page = (text: string) =>
  EditorState.create({
    doc: text,
    extensions: [
      history(),
      drawSelection(),
      dropCursor(),
      bracketMatching(),
      highlightSelectionMatches(),
      EditorView.lineWrapping,
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      syntaxHighlighting(classHighlighter),
      live,
      tables,
      keymap.of([
        { key: "Mod-b", run: bold },
        { key: "Mod-i", run: italic },
        { key: "Mod-k", run: deleteLine },
        indentWithTab,
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
      ]),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return;
        dirty = true;
        retitle();
        soon();
      }),
    ],
  });

const view = new EditorView({ state: page(""), parent: document.querySelector("#source")! });

const show = (opened: { path: string, text: string }) => {
  path = opened.path;
  dirty = false;
  view.setState(page(opened.text));
  retitle();
  draw();
  view.focus();
};

const open = async () => {
  const opened = await window.poema.query("open", {});
  if (opened.was === "answered") show(opened.answer);
};

const save = async (elsewhere: boolean) => {
  const text = view.state.doc.toString();
  const saved = await window.poema.execute("save", elsewhere ? { text } : { path, text });
  if (saved.was !== "done") return;
  path = saved.result.path;
  dirty = false;
  retitle();
  draw();
};

const split = () => {
  rendered.hidden = !rendered.hidden;
  draw();
  view.focus();
};

const renderApart = async () => {
  await window.poema.renderApart();
  draw();
};

const bump = (setting: "zoom" | "lineHeight", by: number, min: number, max: number) => {
  if (!current) return;
  const value = Math.round(Math.min(max, Math.max(min, current[setting] + by)) * 10) / 10;
  window.poema.execute("settings", setting === "zoom" ? { zoom: value } : { lineHeight: value });
};

const zoomIn = () => bump("zoom", 0.5, -5, 5);
const zoomOut = () => bump("zoom", -0.5, -5, 5);
const zoomReset = () => window.poema.execute("settings", { zoom: 0 });

const fonts = document.querySelector<HTMLDataListElement>("#fonts")!;

const configure = async () => {
  if (settings.open) return settings.close();
  if (!fonts.options.length) {
    const found = await window.poema.query("fonts", {});
    if (found.was === "answered") fonts.replaceChildren(...found.answer.map((family) => new Option(family)));
  }
  for (const input of settings.querySelectorAll("input")) {
    input.value = String(current?.[input.name as keyof typeof current] ?? "");
  }
  settings.showModal();
};

settings.addEventListener("change", ({ target }) => {
  const input = target as HTMLInputElement;
  if (!input.value) return;
  const value = input.type === "number" ? Number(input.value) : input.value;
  window.poema.execute("settings", { [input.name]: value });
});

settings.addEventListener("close", () => view.focus());

const showManual = async () => {
  const read = await window.poema.query("manual", {});
  if (read.was !== "answered") return;
  path = undefined;
  dirty = false;
  view.setState(page(read.answer.text));
  document.title = "manual";
  draw();
  view.focus();
};

const shortcuts = (key: KeyboardEvent): (() => unknown) | undefined => {
  if (key.code === "F1" && key.altKey) return () => window.poema.execute("open-manual", {});

  const mod = key.ctrlKey || key.metaKey;
  const bigger = key.code === "Equal" || key.code === "NumpadAdd";
  const smaller = key.code === "Minus" || key.code === "NumpadSubtract";

  if (key.altKey && key.shiftKey && !mod) {
    if (bigger) return () => bump("lineHeight", 0.1, 1, 3);
    if (smaller) return () => bump("lineHeight", -0.1, 1, 3);
  }

  if (mod && key.shiftKey && !key.altKey) {
    if (bigger) return zoomIn;
    if (smaller) return zoomOut;
    if (key.code === "KeyS") return () => save(true);
    if (key.code === "KeyN") return () => window.poema.execute("new-window", {});
    if (key.code === "KeyE") return renderApart;
  }

  if (mod && !key.shiftKey && !key.altKey) {
    if (key.code === "KeyO") return open;
    if (key.code === "KeyS") return () => save(false);
    if (key.code === "KeyE") return split;
    if (key.code === "Comma") return configure;
    if (key.code === "Digit0" || key.code === "Numpad0") return zoomReset;
  }
};

addEventListener("keydown", (key) => {
  const shortcut = shortcuts(key);
  if (!shortcut) return;
  key.preventDefault();
  key.stopPropagation();
  shortcut();
}, { capture: true });

addEventListener("wheel", (wheel) => {
  if (!wheel.ctrlKey || !wheel.deltaY) return;
  wheel.preventDefault();
  if (wheel.deltaY < 0) zoomIn();
  else zoomOut();
}, { passive: false });

// a new line height changes every line's size, and codemirror has to measure again
window.poema.on("settings", () => view.requestMeasure());
whenLanguageArrives(draw);

await dress();
retitle();

// poema <file> opens straight into it; the first run opens on the manual
const asked = new URLSearchParams(location.search);
const file = asked.get("path");
if (file) {
  const read = await window.poema.query("read", { path: file });
  if (read.was === "answered") show(read.answer);
} else if (asked.has("manual")) {
  await showManual();
}

view.focus();
