import { syntaxTree } from "@codemirror/language";
import { type EditorState, type Range, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import { toHtml } from "./render.ts";

// a table shows rendered, the way the rendered view draws it, until the cursor
// goes into it; then its markdown comes back to be edited. clicking the
// rendered table puts the cursor at its start.
//
// a block that replaces lines has to come from a state field, not a view
// plugin, so this one looks at the whole text. tables are few, and it only
// redraws when the text, the cursor or the parse moves.

class Table extends WidgetType {
  readonly markdown: string;
  readonly from: number;

  constructor(markdown: string, from: number) {
    super();
    this.markdown = markdown;
    this.from = from;
  }

  eq(other: Table) {
    return other.markdown === this.markdown && other.from === this.from;
  }

  toDOM(view: EditorView) {
    const box = document.createElement("div");
    box.className = "cm-table page";
    box.innerHTML = toHtml(this.markdown);
    box.addEventListener("mousedown", (click) => {
      click.preventDefault();
      view.dispatch({ selection: { anchor: this.from } });
      view.focus();
    });
    return box;
  }

  ignoreEvent() {
    return false;
  }
}

const decorate = (state: EditorState): DecorationSet => {
  const found: Range<Decoration>[] = [];

  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name !== "Table") return;

      const from = state.doc.lineAt(node.from).from;
      const to = state.doc.lineAt(node.to).to;
      const touched = state.selection.ranges.some((range) => range.to >= from && range.from <= to);

      if (!touched) {
        const widget = new Table(state.sliceDoc(from, to), from);
        found.push(Decoration.replace({ widget, block: true }).range(from, to));
      }
      return false;
    },
  });

  return Decoration.set(found, true);
};

export const tables = StateField.define<DecorationSet>({
  create: decorate,
  update: (decorations, transaction) => {
    const reparsed = syntaxTree(transaction.startState) !== syntaxTree(transaction.state);
    if (transaction.docChanged || transaction.selection || reparsed) return decorate(transaction.state);
    return decorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});
