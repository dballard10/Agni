import { useCallback, useRef, useEffect, useMemo } from "react";
import {
  DarkCodeMirror,
  type ReactCodeMirrorRef,
} from "../../../shared/ui/DarkCodeMirror";
import { markdown } from "@codemirror/lang-markdown";
import {
  EditorView,
  Decoration,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import { RangeSet, EditorSelection } from "@codemirror/state";
import { syntaxTree, HighlightStyle } from "@codemirror/language";
import { syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

// ----------------------------------------------------------------------------
// Theme matching app's slate dark design with prose-like typography
// Uses CSS variables from index.css (--notes-*) for centralized theming
// ----------------------------------------------------------------------------
const livePreviewTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      color: "var(--notes-fg)",
      fontSize: "15px",
      fontFamily: "var(--notes-editor-font)",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
      letterSpacing: "-0.01em",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-content": {
      padding: "24px",
      caretColor: "var(--notes-caret)",
      lineHeight: "1.75",
      fontFamily: "inherit",
    },
    ".cm-line": {
      padding: "2px 0",
      fontFamily: "inherit",
    },
    ".cm-gutters": {
      display: "none",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--notes-caret)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "var(--notes-selection-bg) !important",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "var(--notes-selection-bg) !important",
    },
    ".cm-activeLine": {
      backgroundColor: "transparent",
    },
    // Force remove underlines from any heading tokens that might be styled by defaults
    ".cm-heading, .tok-heading, .cm-header": {
      textDecoration: "none !important",
    },
    // Live preview styles for non-active lines
    ".lp-heading-1": {
      fontSize: "1.5em",
      fontWeight: "700",
      color: "var(--notes-fg-strong)",
      fontFamily: "inherit",
    },
    ".lp-heading-1 span": {
      textDecoration: "none !important",
    },
    ".lp-heading-2": {
      fontSize: "1.25em",
      fontWeight: "600",
      color: "var(--notes-fg-strong)",
      fontFamily: "inherit",
    },
    ".lp-heading-2 span": {
      textDecoration: "none !important",
    },
    ".lp-heading-3": {
      fontSize: "1.125em",
      fontWeight: "600",
      color: "var(--notes-fg-heading-3)",
      fontFamily: "inherit",
    },
    ".lp-heading-3 span": {
      textDecoration: "none !important",
    },
    ".lp-heading-4, .lp-heading-5, .lp-heading-6": {
      fontSize: "1em",
      fontWeight: "600",
      color: "var(--notes-fg)",
      fontFamily: "inherit",
    },
    ".lp-heading-4 span, .lp-heading-5 span, .lp-heading-6 span": {
      textDecoration: "none !important",
    },
    ".lp-blockquote": {
      borderLeft: "3px solid var(--notes-border-soft)",
      paddingLeft: "12px",
      color: "var(--notes-muted)",
      fontStyle: "italic",
    },
    ".lp-list-item": {
      paddingLeft: "8px",
    },
    ".lp-code-inline": {
      backgroundColor: "var(--notes-code-bg)",
      padding: "2px 6px",
      borderRadius: "4px",
      color: "var(--notes-code-inline)",
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: "0.9em",
    },
    ".lp-code-fence": {
      backgroundColor: "var(--notes-code-bg)",
      borderRadius: "6px",
      padding: "4px 8px",
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: "0.9em",
    },
    ".lp-bold": {
      fontWeight: "700",
      color: "var(--notes-fg-strong)",
    },
    ".lp-italic": {
      fontStyle: "italic",
      color: "var(--notes-fg)",
    },
    ".lp-link": {
      color: "var(--notes-link)",
      textDecoration: "underline",
      textUnderlineOffset: "2px",
    },
    ".lp-bracket-link": {
      color: "var(--notes-link)",
      textDecoration: "underline",
      textUnderlineOffset: "2px",
      cursor: "pointer",
    },
    ".lp-hidden": {
      fontSize: "0",
      width: "0",
      display: "inline-block",
      overflow: "hidden",
    },
    ".lp-checkbox": {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "16px",
      height: "16px",
      border: "1px solid var(--notes-checkbox-border)",
      borderRadius: "3px",
      marginRight: "8px",
      backgroundColor: "var(--notes-checkbox-bg)",
      verticalAlign: "middle",
      cursor: "pointer",
    },
    ".lp-checkbox-checked": {
      backgroundColor: "var(--notes-checkbox-checked-bg)",
      borderColor: "var(--notes-checkbox-checked-bg)",
    },
    ".lp-bullet": {
      display: "inline-block",
      width: "6px",
      height: "6px",
      backgroundColor: "var(--notes-list-bullet)",
      borderRadius: "50%",
      marginRight: "10px",
      verticalAlign: "middle",
    },
    ".lp-number": {
      display: "inline-block",
      color: "var(--notes-list-number)",
      marginRight: "8px",
      minWidth: "20px",
      textAlign: "right",
    },
    ".lp-hr": {
      display: "flex",
      alignItems: "center",
      width: "100%",
      height: "0em",
    },
    ".lp-hr::after": {
      content: '""',
      display: "block",
      width: "100%",
      height: "1px",
      backgroundColor: "var(--notes-border)",
    },
  },
  { dark: true }
);

// ----------------------------------------------------------------------------
// Custom syntax highlighting using CSS variables
// This overrides the default dark theme colors for markdown tokens
// ----------------------------------------------------------------------------
const notesHighlightStyle = HighlightStyle.define([
  // General heading tag (covers all heading content) - disable underline
  { tag: tags.heading, textDecoration: "none" },
  {
    tag: tags.heading1,
    color: "var(--notes-fg-strong)",
    fontWeight: "700",
    textDecoration: "none",
  },
  {
    tag: tags.heading2,
    color: "var(--notes-fg-strong)",
    fontWeight: "600",
    textDecoration: "none",
  },
  {
    tag: tags.heading3,
    color: "var(--notes-fg-heading-3)",
    fontWeight: "600",
    textDecoration: "none",
  },
  {
    tag: tags.heading4,
    color: "var(--notes-fg-heading-3)",
    fontWeight: "600",
    textDecoration: "none",
  },
  {
    tag: tags.heading5,
    color: "var(--notes-fg)",
    fontWeight: "600",
    textDecoration: "none",
  },
  {
    tag: tags.heading6,
    color: "var(--notes-fg)",
    fontWeight: "600",
    textDecoration: "none",
  },
  { tag: tags.link, color: "var(--notes-link)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--notes-muted)" },
  { tag: tags.emphasis, color: "var(--notes-fg)", fontStyle: "italic" },
  { tag: tags.strong, color: "var(--notes-fg-strong)", fontWeight: "700" },
  { tag: tags.monospace, color: "var(--notes-code-inline)" },
  {
    tag: tags.strikethrough,
    textDecoration: "line-through",
    color: "var(--notes-muted)",
  },
  { tag: tags.quote, color: "var(--notes-muted)", fontStyle: "italic" },
  { tag: tags.meta, color: "var(--notes-muted)" },
  { tag: tags.processingInstruction, color: "var(--notes-muted)" },
  { tag: tags.contentSeparator, color: "var(--notes-border)" },
]);

// ----------------------------------------------------------------------------
// Checkbox widget for task items
// ----------------------------------------------------------------------------
class CheckboxWidget extends WidgetType {
  readonly checked: boolean;
  readonly pos: number;

  constructor(checked: boolean, pos: number) {
    super();
    this.checked = checked;
    this.pos = pos;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = `lp-checkbox${this.checked ? " lp-checkbox-checked" : ""}`;
    span.setAttribute("data-checkbox-pos", this.pos.toString());
    span.setAttribute("role", "checkbox");
    span.setAttribute("aria-checked", this.checked ? "true" : "false");

    if (this.checked) {
      span.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    }
    return span;
  }

  ignoreEvent() {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Bullet widget for unordered list items
// ----------------------------------------------------------------------------
class BulletWidget extends WidgetType {
  toDOM() {
    const span = document.createElement("span");
    span.className = "lp-bullet";
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

// ----------------------------------------------------------------------------
// Number widget for ordered list items
// ----------------------------------------------------------------------------
class NumberWidget extends WidgetType {
  readonly num: string;

  constructor(num: string) {
    super();
    this.num = num;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "lp-number";
    span.textContent = `${this.num}.`;
    return span;
  }

  ignoreEvent() {
    return true;
  }
}

// ----------------------------------------------------------------------------
// Horizontal rule widget for --- / *** / ___
// ----------------------------------------------------------------------------
class HrWidget extends WidgetType {
  toDOM() {
    const hr = document.createElement("div");
    hr.className = "lp-hr";
    return hr;
  }

  ignoreEvent() {
    return true;
  }
}

// ----------------------------------------------------------------------------
// Live preview decorations plugin
// ----------------------------------------------------------------------------
const hiddenMark = Decoration.mark({ class: "lp-hidden" });
const boldMark = Decoration.mark({ class: "lp-bold" });
const italicMark = Decoration.mark({ class: "lp-italic" });
const linkMark = Decoration.mark({ class: "lp-link" });
const inlineCodeMark = Decoration.mark({ class: "lp-code-inline" });
const codeFenceMark = Decoration.mark({ class: "lp-code-fence" });
const blockquoteMark = Decoration.line({ class: "lp-blockquote" });
const listItemMark = Decoration.line({ class: "lp-list-item" });

// Bracket link marks with data attributes for click handling
function wikiLinkMark(label: string) {
  return Decoration.mark({
    class: "lp-bracket-link",
    attributes: { "data-wikilink": label },
  });
}

function bracketLinkMark(label: string) {
  return Decoration.mark({
    class: "lp-bracket-link",
    attributes: { "data-bracketlink": label },
  });
}

function headingLineMark(level: number) {
  return Decoration.line({ class: `lp-heading-${level}` });
}

function getActiveLineNumbers(view: EditorView): Set<number> {
  const activeLines = new Set<number>();
  // When editor is not focused, no lines are "active" - show preview for all lines
  if (!view.hasFocus) {
    return activeLines;
  }
  for (const range of view.state.selection.ranges) {
    const startLine = view.state.doc.lineAt(range.from).number;
    const endLine = view.state.doc.lineAt(range.to).number;
    for (let i = startLine; i <= endLine; i++) {
      activeLines.add(i);
    }
  }
  return activeLines;
}

function buildDecorations(view: EditorView): RangeSet<Decoration> {
  const activeLines = getActiveLineNumbers(view);
  const doc = view.state.doc;
  const tree = syntaxTree(view.state);

  // Track fenced code block ranges
  const fencedRanges: Array<{ from: number; to: number }> = [];
  tree.iterate({
    enter(node) {
      if (node.name === "FencedCode") {
        fencedRanges.push({ from: node.from, to: node.to });
      }
    },
  });

  const isInFencedBlock = (pos: number) =>
    fencedRanges.some((r) => pos >= r.from && pos <= r.to);

  // Collect all decorations - will use Decoration.set() with sorting
  const ranges: Array<{ from: number; to: number; value: Decoration }> = [];

  // Helper to add a decoration
  const addRange = (from: number, to: number, value: Decoration) => {
    ranges.push({ from, to, value });
  };

  // Process each line
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const lineText = line.text;
    const isActive = activeLines.has(i);

    // Skip if line is inside a fenced code block (except for the fence markers themselves)
    if (isInFencedBlock(line.from) && !lineText.startsWith("```")) {
      continue;
    }

    // Heading detection - apply line class even on active lines (for CSS styling)
    // but only hide markers on non-active lines
    const headingMatch = lineText.match(/^(#{1,6})\s/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      // Line decoration for heading style (always applied)
      addRange(line.from, line.from, headingLineMark(level));
      // Hide the # markers and space (only on non-active lines)
      if (!isActive) {
        addRange(line.from, line.from + headingMatch[0].length, hiddenMark);
      }
    }

    // Wiki links [[Title]] - style on both active and non-active lines
    // Hide brackets only on non-active lines
    const wikiLinkRegexActive = /\[\[([^\]]+)\]\]/g;
    let wikiMatch;
    while ((wikiMatch = wikiLinkRegexActive.exec(lineText)) !== null) {
      const start = line.from + wikiMatch.index;
      const label = wikiMatch[1];
      const innerStart = start + 2; // after [[
      const innerEnd = innerStart + label.length;
      const end = start + wikiMatch[0].length;

      if (isActive) {
        // Active line: style inner text only, keep brackets visible
        addRange(innerStart, innerEnd, wikiLinkMark(label));
      } else {
        // Non-active line: hide [[ and ]] brackets
        addRange(start, innerStart, hiddenMark);
        addRange(innerStart, innerEnd, wikiLinkMark(label));
        addRange(innerEnd, end, hiddenMark);
      }
    }

    // Single bracket links [Title] - style on both active and non-active lines
    // Match [text] NOT followed by ( (to avoid markdown links)
    // Skip task checkboxes like - [ ] or - [x] via code check
    const bracketLinkRegexActive = /\[([^\[\]]+)\](?!\()/g;
    let bracketMatch;
    while ((bracketMatch = bracketLinkRegexActive.exec(lineText)) !== null) {
      const label = bracketMatch[1];
      // Skip task checkbox patterns: single space or single 'x'
      if (label === " " || label === "x") continue;

      const start = line.from + bracketMatch.index;
      const end = start + bracketMatch[0].length;

      // Keep brackets visible, style the whole token
      addRange(start, end, bracketLinkMark(label));
    }

    // Skip remaining decorations for active lines
    if (isActive) continue;

    // Horizontal rule detection: ---, ***, ___ (3+ chars, optional spaces between)
    // Standard markdown HR: line containing only 3+ of the same char (- * _) with optional whitespace
    const hrMatch = lineText.match(/^\s*([-*_])(?:\s*\1){2,}\s*$/);
    if (hrMatch) {
      // Hide the HR text and add widget
      addRange(line.from, line.to, hiddenMark);
      addRange(
        line.from,
        line.from,
        Decoration.widget({
          widget: new HrWidget(),
          side: 1,
        })
      );
      continue;
    }

    // Blockquote detection
    const blockquoteMatch = lineText.match(/^>\s?/);
    if (blockquoteMatch) {
      addRange(line.from, line.from, blockquoteMark);
      addRange(line.from, line.from + blockquoteMatch[0].length, hiddenMark);
    }

    // Task list detection - [ ] or - [x]
    const taskMatch = lineText.match(/^(\s*)- \[([ xX])\]\s/);
    if (taskMatch) {
      const indent = taskMatch[1].length;
      const checked = taskMatch[2].toLowerCase() === "x";
      const markerEnd = line.from + taskMatch[0].length;
      // Position of the [ ] or [x] character (inside the brackets)
      const checkboxCharPos = line.from + indent + 3;

      // Line decoration
      addRange(line.from, line.from, listItemMark);
      // Hide the marker
      addRange(line.from + indent, markerEnd, hiddenMark);
      // Add checkbox widget
      addRange(
        line.from + indent,
        line.from + indent,
        Decoration.widget({
          widget: new CheckboxWidget(checked, checkboxCharPos),
          side: 1,
        })
      );
    }

    // Unordered list detection (- or *)
    // Skip if already matched as task list
    if (!taskMatch) {
      const ulMatch = lineText.match(/^(\s*)[-*]\s/);
      if (ulMatch) {
        const indent = ulMatch[1].length;
        const markerEnd = line.from + ulMatch[0].length;

        addRange(line.from, line.from, listItemMark);
        addRange(line.from + indent, markerEnd, hiddenMark);
        addRange(
          line.from + indent,
          line.from + indent,
          Decoration.widget({
            widget: new BulletWidget(),
            side: 1,
          })
        );
      }
    }

    // Ordered list detection
    const olMatch = lineText.match(/^(\s*)(\d+)\.\s/);
    if (olMatch) {
      const indent = olMatch[1].length;
      const num = olMatch[2];
      const markerEnd = line.from + olMatch[0].length;

      addRange(line.from, line.from, listItemMark);
      addRange(line.from + indent, markerEnd, hiddenMark);
      addRange(
        line.from + indent,
        line.from + indent,
        Decoration.widget({
          widget: new NumberWidget(num),
          side: 1,
        })
      );
    }

    // Fenced code block markers - skip inline formatting for these
    if (lineText.startsWith("```")) {
      addRange(line.from, line.to, codeFenceMark);
      continue;
    }

    // Inline formatting within the line (bold, italic, inline code, links)
    // Runs on all non-active lines including headings, lists, blockquotes, etc.
    // Bold **text** or __text__
    let match;
    const boldRegex = /(\*\*|__)(.+?)\1/g;
    while ((match = boldRegex.exec(lineText)) !== null) {
      const start = line.from + match.index;
      const markerLen = match[1].length;
      const end = start + match[0].length;

      addRange(start, start + markerLen, hiddenMark);
      addRange(start + markerLen, end - markerLen, boldMark);
      addRange(end - markerLen, end, hiddenMark);
    }

    // Italic *text* or _text_ (but not inside bold)
    const italicRegex =
      /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g;
    while ((match = italicRegex.exec(lineText)) !== null) {
      const start = line.from + match.index;
      const end = start + match[0].length;

      addRange(start, start + 1, hiddenMark);
      addRange(start + 1, end - 1, italicMark);
      addRange(end - 1, end, hiddenMark);
    }

    // Inline code `code`
    const codeRegex = /`([^`]+)`/g;
    while ((match = codeRegex.exec(lineText)) !== null) {
      const start = line.from + match.index;
      const end = start + match[0].length;

      addRange(start, start + 1, hiddenMark);
      addRange(start + 1, end - 1, inlineCodeMark);
      addRange(end - 1, end, hiddenMark);
    }

    // Links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    while ((match = linkRegex.exec(lineText)) !== null) {
      const start = line.from + match.index;
      const textStart = start + 1;
      const textEnd = textStart + match[1].length;
      const end = start + match[0].length;

      addRange(start, start + 1, hiddenMark);
      addRange(textStart, textEnd, linkMark);
      addRange(textEnd, end, hiddenMark);
    }
  }

  // Use Decoration.set with sort=true to handle sorting automatically
  return Decoration.set(
    ranges.map((r) => r.value.range(r.from, r.to)),
    true
  );
}

const livePreviewPlugin = ViewPlugin.fromClass(
  class {
    decorations: RangeSet<Decoration>;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      // Rebuild on doc changes, selection changes, viewport changes, or focus changes
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged ||
        update.focusChanged
      ) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// ----------------------------------------------------------------------------
// LiveMarkdownEditor component
// ----------------------------------------------------------------------------
interface JumpTarget {
  from: number;
  to: number;
  nonce: number;
}

interface LiveMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  jumpTo?: JumpTarget | null;
  onOpenBracketLink?: (label: string) => void;
  /** "preview" shows live-preview (markers hidden on non-active lines); "edit" shows raw markdown */
  mode?: "preview" | "edit";
  /** Whether to auto-focus the editor on mount */
  autoFocus?: boolean;
}

export function LiveMarkdownEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  jumpTo,
  onOpenBracketLink,
  mode = "preview",
  autoFocus = false,
}: LiveMarkdownEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const lastJumpNonce = useRef<number | null>(null);
  const onOpenBracketLinkRef = useRef(onOpenBracketLink);

  // Keep ref in sync with prop
  useEffect(() => {
    onOpenBracketLinkRef.current = onOpenBracketLink;
  }, [onOpenBracketLink]);

  // Blur editor when mode changes so no cursor/active line shows until user clicks
  useEffect(() => {
    editorRef.current?.view?.contentDOM.blur();
  }, [mode]);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  // Click handler extension for bracket links
  const bracketLinkClickHandler = useMemo(
    () =>
      EditorView.domEventHandlers({
        click: (event) => {
          const target = event.target as HTMLElement;
          // Walk up to find element with data attribute (mark may wrap span)
          let el: HTMLElement | null = target;
          for (let i = 0; i < 3 && el; i++) {
            const wikiLabel = el.getAttribute("data-wikilink");
            const bracketLabel = el.getAttribute("data-bracketlink");
            if (wikiLabel || bracketLabel) {
              const label = wikiLabel ?? bracketLabel;
              if (label && onOpenBracketLinkRef.current) {
                event.preventDefault();
                onOpenBracketLinkRef.current(label);
                return true;
              }
            }
            el = el.parentElement;
          }
          return false;
        },
      }),
    []
  );

  // Click handler for task checkboxes
  const taskCheckboxClickHandler = useMemo(
    () =>
      EditorView.domEventHandlers({
        mousedown: (event, _view) => {
          const target = event.target as HTMLElement;
          if (target.closest(".lp-checkbox")) {
            // Prevent editor from focusing or moving selection when clicking the checkbox
            event.preventDefault();
            return true;
          }
          return false;
        },
        click: (event, view) => {
          const target = event.target as HTMLElement;
          const checkbox = target.closest(".lp-checkbox");
          if (checkbox) {
            const posAttr = checkbox.getAttribute("data-checkbox-pos");
            if (posAttr) {
              const pos = parseInt(posAttr, 10);
              const currentChar = view.state.doc.sliceString(pos, pos + 1);
              const nextChar = currentChar === " " ? "x" : " ";
              view.dispatch({
                changes: { from: pos, to: pos + 1, insert: nextChar },
              });
              event.preventDefault();
              return true;
            }
          }
          return false;
        },
      }),
    []
  );

  // Jump to match when jumpTo changes
  useEffect(() => {
    if (!jumpTo || jumpTo.nonce === lastJumpNonce.current) return;
    lastJumpNonce.current = jumpTo.nonce;

    // Small delay to ensure the editor has mounted and value is set
    const timeoutId = setTimeout(() => {
      const view = editorRef.current?.view;
      if (!view) return;

      const docLength = view.state.doc.length;
      const from = Math.min(jumpTo.from, docLength);
      const to = Math.min(jumpTo.to, docLength);

      view.dispatch({
        selection: EditorSelection.range(from, to),
        scrollIntoView: true,
        effects: EditorView.scrollIntoView(from, { y: "center" }),
      });

      // Focus the editor
      view.focus();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [jumpTo]);

  const extensions: Extension[] = [
    markdown(),
    livePreviewTheme,
    // Add our custom syntax highlighting with fallback=false to override defaults
    syntaxHighlighting(notesHighlightStyle),
    // Only include live preview plugin in preview mode; edit mode shows raw markdown
    ...(mode === "preview" ? [livePreviewPlugin] : []),
    EditorView.lineWrapping,
    bracketLinkClickHandler,
    taskCheckboxClickHandler,
  ];

  // Add placeholder extension
  if (placeholder) {
    extensions.push(
      EditorView.theme({
        ".cm-content[data-placeholder]::before": {
          content: `"${placeholder}"`,
          color: "var(--notes-placeholder)",
          position: "absolute",
          pointerEvents: "none",
        },
      })
    );
  }

  return (
    <div className="h-full w-full overflow-auto">
      <DarkCodeMirror
        ref={editorRef}
        value={value}
        onChange={handleChange}
        extensions={extensions}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: false,
          closeBrackets: false,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightActiveLineGutter: false,
          searchKeymap: false,
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-full"
      />
    </div>
  );
}

export default LiveMarkdownEditor;
