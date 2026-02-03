import { forwardRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import type { ReactCodeMirrorProps, ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";

export type { ReactCodeMirrorProps, ReactCodeMirrorRef };

/**
 * Base dark theme for CodeMirror that sets up dark-mode backgrounds and basic styling.
 * Does NOT include syntax highlighting - that should be provided via extensions.
 */
const baseDarkTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
  },
  "&.cm-focused": {
    outline: "none",
  },
}, { dark: true });

/**
 * A wrapper for CodeMirror that provides a base dark theme without syntax highlighting.
 * This allows consumers to provide their own custom syntax highlighting via extensions.
 */
export const DarkCodeMirror = forwardRef<ReactCodeMirrorRef, Omit<ReactCodeMirrorProps, "theme">>(
  (props, ref) => {
    // Prepend our base dark theme to any provided extensions
    const extensions = [baseDarkTheme, ...(props.extensions || [])];
    return <CodeMirror {...props} ref={ref} extensions={extensions} theme="none" />;
  }
);

DarkCodeMirror.displayName = "DarkCodeMirror";

export default DarkCodeMirror;
