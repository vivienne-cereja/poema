import { EditorSelection, type StateCommand } from "@codemirror/state";

// ctrl+b and ctrl+i: put the marks around what's selected, or take them off
// when they're already there. an empty selection gets an empty pair, with the
// cursor between, ready to type into.
//
// both use *, so the stars around a selection say what's on: two is bold, one
// is italic, three is both.

const stars = (text: string) => text.length - text.replace(/\*+$/, "").length;

const toggle = (mark: "**" | "*"): StateCommand => ({ state, dispatch }) => {
  const size = mark.length;
  const changes = state.changeByRange((range) => {
    const before = stars(state.sliceDoc(Math.max(0, range.from - 3), range.from));
    const after = stars([...state.sliceDoc(range.to, range.to + 3)].reverse().join(""));
    const around = Math.min(before, after);
    const on = size === 2 ? around >= 2 : around % 2 === 1;

    if (on) {
      return {
        changes: [{ from: range.from - size, to: range.from }, { from: range.to, to: range.to + size }],
        range: EditorSelection.range(range.from - size, range.to - size),
      };
    }

    return {
      changes: [{ from: range.from, insert: mark }, { from: range.to, insert: mark }],
      range: EditorSelection.range(range.from + size, range.to + size),
    };
  });
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input.format" }));
  return true;
};

export const bold = toggle("**");
export const italic = toggle("*");
