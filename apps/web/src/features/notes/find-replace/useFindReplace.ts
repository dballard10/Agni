import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";
import { setFindMatches, type FindMatch } from "./findReplaceExtension";

interface UseFindReplaceOptions {
  content: string;
  getEditorView: () => EditorView | undefined;
  onContentChange: (content: string) => void;
}

export interface FindReplaceState {
  isOpen: boolean;
  searchTerm: string;
  replaceTerm: string;
  matches: FindMatch[];
  currentMatchIndex: number;
}

export interface FindReplaceActions {
  open: () => void;
  close: () => void;
  setSearchTerm: (term: string) => void;
  setReplaceTerm: (term: string) => void;
  nextMatch: () => void;
  prevMatch: () => void;
  replace: () => void;
  replaceAll: () => void;
  goToMatch: (index: number) => void;
}

function findAllMatches(content: string, searchTerm: string): FindMatch[] {
  if (!searchTerm) return [];

  const matches: FindMatch[] = [];
  const lowerContent = content.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  let startIndex = 0;

  while (startIndex < content.length) {
    const index = lowerContent.indexOf(lowerSearch, startIndex);
    if (index === -1) break;
    matches.push({ from: index, to: index + searchTerm.length });
    startIndex = index + 1;
  }

  return matches;
}

export function useFindReplace({
  content,
  getEditorView,
  onContentChange,
}: UseFindReplaceOptions): {
  state: FindReplaceState;
  actions: FindReplaceActions;
} {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  const matches = useMemo(
    () => findAllMatches(content, debouncedSearchTerm),
    [content, debouncedSearchTerm]
  );

  useEffect(() => {
    if (currentMatchIndex >= matches.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clamp index when matches shrink
      setCurrentMatchIndex(Math.max(0, matches.length - 1));
    }
  }, [matches.length, currentMatchIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const view = getEditorView();
    if (!view) return;

    view.dispatch({
      effects: setFindMatches.of({ matches, currentIndex: currentMatchIndex }),
    });
  }, [isOpen, matches, currentMatchIndex, getEditorView]);

  const scrollToMatch = useCallback(
    (index: number) => {
      const view = getEditorView();
      if (!view || matches.length === 0 || index < 0 || index >= matches.length)
        return;

      const match = matches[index];
      view.dispatch({
        selection: EditorSelection.range(match.from, match.to),
        scrollIntoView: true,
        effects: EditorView.scrollIntoView(match.from, { y: "center" }),
      });
    },
    [getEditorView, matches]
  );

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
    setReplaceTerm("");
    setDebouncedSearchTerm("");
    setCurrentMatchIndex(0);

    const view = getEditorView();
    if (view) {
      view.dispatch({
        effects: setFindMatches.of({ matches: [], currentIndex: 0 }),
      });
    }
  }, [getEditorView]);

  const handleSetSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentMatchIndex(0);
  }, []);

  const handleSetReplaceTerm = useCallback((term: string) => {
    setReplaceTerm(term);
  }, []);

  const nextMatch = useCallback(() => {
    if (matches.length === 0) return;
    const next = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(next);
    scrollToMatch(next);
  }, [matches.length, currentMatchIndex, scrollToMatch]);

  const prevMatch = useCallback(() => {
    if (matches.length === 0) return;
    const prev = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prev);
    scrollToMatch(prev);
  }, [matches.length, currentMatchIndex, scrollToMatch]);

  const goToMatch = useCallback(
    (index: number) => {
      if (index < 0 || index >= matches.length) return;
      setCurrentMatchIndex(index);
      scrollToMatch(index);
    },
    [matches.length, scrollToMatch]
  );

  const replace = useCallback(() => {
    if (matches.length === 0 || !debouncedSearchTerm) return;

    const match = matches[currentMatchIndex];
    if (!match) return;

    const before = content.slice(0, match.from);
    const after = content.slice(match.to);
    const newContent = before + replaceTerm + after;

    onContentChange(newContent);

    const newMatches = findAllMatches(newContent, debouncedSearchTerm);
    if (newMatches.length > 0) {
      const nextIndex = Math.min(currentMatchIndex, newMatches.length - 1);
      setCurrentMatchIndex(nextIndex);
      setTimeout(() => scrollToMatch(nextIndex), 50);
    }
  }, [
    matches,
    currentMatchIndex,
    content,
    replaceTerm,
    debouncedSearchTerm,
    onContentChange,
    scrollToMatch,
  ]);

  const replaceAll = useCallback(() => {
    if (matches.length === 0 || !debouncedSearchTerm) return;

    const regex = new RegExp(
      debouncedSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi"
    );
    const newContent = content.replace(regex, replaceTerm);

    onContentChange(newContent);
    setCurrentMatchIndex(0);
  }, [matches.length, debouncedSearchTerm, content, replaceTerm, onContentChange]);

  return {
    state: {
      isOpen,
      searchTerm,
      replaceTerm,
      matches,
      currentMatchIndex,
    },
    actions: {
      open,
      close,
      setSearchTerm: handleSetSearchTerm,
      setReplaceTerm: handleSetReplaceTerm,
      nextMatch,
      prevMatch,
      replace,
      replaceAll,
      goToMatch,
    },
  };
}
