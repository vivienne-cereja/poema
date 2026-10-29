import { LanguageDescription, type LanguageSupport } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { classHighlighter, highlightCode } from "@lezer/highlight";
import { Marked } from "marked";

// the split pane and the window apart show the same thing by definition, so
// both render here. code blocks get the same highlighter, with the same
// classes, that colours them in the editor.

const ready = new Map<string, LanguageSupport>();
const loading = new Set<string>();
const arrivals = new Set<() => void>();

export const whenLanguageArrives = (redraw: () => void) => arrivals.add(redraw);

const escape = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const code = (text: string, name: string | undefined) => {
  const description = name ? LanguageDescription.matchLanguageName(languages, name, true) : null;
  const support = description && ready.get(description.name);

  if (description && !support && !loading.has(description.name)) {
    loading.add(description.name);
    description.load().then((loaded) => {
      ready.set(description.name, loaded);
      for (const redraw of arrivals) redraw();
    });
  }

  if (!support) return `<pre><code>${escape(text)}</code></pre>`;

  let html = "";
  highlightCode(
    text,
    support.language.parser.parse(text),
    classHighlighter,
    (piece, classes) => html += classes ? `<span class="${classes}">${escape(piece)}</span>` : escape(piece),
    () => html += "\n",
  );
  return `<pre><code>${html}</code></pre>`;
};

const marked = new Marked({
  gfm: true,
  renderer: { code: ({ text, lang }) => code(text, lang?.split(/\s/)[0]) },
});

export const toHtml = (text: string) => marked.parse(text, { async: false });
