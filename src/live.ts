import { syntaxTree } from "@codemirror/language";
import type { Range } from "@codemirror/state";
import { Decoration, type DecorationSet, type EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";

// editing the way obsidian does: headings grow, code blocks and quotes get
// their own look, and the markup (#, *, `, the link's url) hides on every line
// except the ones the cursor is on. only what's on screen is looked at, so a
// long text costs what fits in the window.

const hide = Decoration.replace({});
const line = (name: string) => Decoration.line({ class: name });

const headings: Record<string, Decoration> = {
  ATXHeading1: line("cm-h1"),
  ATXHeading2: line("cm-h2"),
  ATXHeading3: line("cm-h3"),
  ATXHeading4: line("cm-h4"),
  ATXHeading5: line("cm-h5"),
  ATXHeading6: line("cm-h6"),
};

const blocks: Record<string, Decoration> = {
  FencedCode: line("cm-codeblock"),
  Blockquote: line("cm-quote"),
};

const decorate = (view: EditorView): DecorationSet => {
  const { state } = view;
  const { doc } = state;

  const active = new Set<number>();
  for (const range of state.selection.ranges) {
    for (let n = doc.lineAt(range.from).number; n <= doc.lineAt(range.to).number; n++) active.add(n);
  }

  const found: Range<Decoration>[] = [];

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: (node) => {
        const { name } = node;
        const parent = node.node.parent?.name;

        const heading = headings[name];
        if (heading) found.push(heading.range(doc.lineAt(node.from).from));

        const block = blocks[name];
        if (block) {
          for (let pos = Math.max(node.from, from); pos <= Math.min(node.to, to);) {
            const each = doc.lineAt(pos);
            found.push(block.range(each.from));
            pos = each.to + 1;
          }
        }

        if (active.has(doc.lineAt(node.from).number)) return;

        if (name === "HeaderMark" && parent?.startsWith("ATXHeading")) {
          const end = doc.sliceString(node.to, node.to + 1) === " " ? node.to + 1 : node.to;
          found.push(hide.range(node.from, end));
        } else if (name === "EmphasisMark" || name === "StrikethroughMark") {
          found.push(hide.range(node.from, node.to));
        } else if (name === "CodeMark" && parent === "InlineCode") {
          found.push(hide.range(node.from, node.to));
        } else if ((name === "LinkMark" || name === "URL" || name === "LinkTitle") && parent === "Link") {
          found.push(hide.range(node.from, node.to));
        }
      },
    });
  }

  return Decoration.set(found, true);
};

export const live = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = decorate(view);
    }

    update(update: ViewUpdate) {
      const reparsed = syntaxTree(update.startState) !== syntaxTree(update.state);
      if (update.docChanged || update.selectionSet || update.viewportChanged || reparsed) {
        this.decorations = decorate(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);
