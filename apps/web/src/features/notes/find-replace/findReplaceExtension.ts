import { StateField, StateEffect } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import type { DecorationSet } from "@codemirror/view";

export interface FindMatch {
  from: number;
  to: number;
}

export const setFindMatches = StateEffect.define<{
  matches: FindMatch[];
  currentIndex: number;
}>();

const matchMark = Decoration.mark({ class: "cm-find-match" });
const currentMatchMark = Decoration.mark({ class: "cm-find-match-current" });

export const findReplaceField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setFindMatches)) {
        const { matches, currentIndex } = effect.value;
        if (matches.length === 0) {
          return Decoration.none;
        }
        const decos = matches.map((m, i) =>
          (i === currentIndex ? currentMatchMark : matchMark).range(m.from, m.to)
        );
        return Decoration.set(decos, true);
      }
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

export const findReplaceTheme = EditorView.theme({
  ".cm-find-match": {
    backgroundColor: "var(--notes-find-match-bg)",
    borderRadius: "2px",
  },
  ".cm-find-match-current": {
    backgroundColor: "var(--notes-find-match-current-bg)",
    borderRadius: "2px",
  },
});

export const findReplaceExtension = [findReplaceField, findReplaceTheme];
