import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
import { syntaxHighlighting } from '@codemirror/language';
import { classHighlighter } from '@lezer/highlight';
import { EditorView } from '@codemirror/view';
import type { JsonError } from '@/lib/json';

export interface JsonEditorHandle {
  goTo(offset: number): void;
  focus(): void;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  error: JsonError | null;
}

export const JsonEditor = forwardRef<JsonEditorHandle, Props>(function JsonEditor({ value, onChange, error }, ref) {
  const cm = useRef<ReactCodeMirrorRef>(null);
  const errorRef = useRef(error);
  errorRef.current = error;

  useImperativeHandle(ref, () => ({
    goTo(offset) {
      const view = cm.current?.view;
      if (!view) return;
      const pos = Math.min(offset, view.state.doc.length);
      view.dispatch({ selection: { anchor: pos }, effects: EditorView.scrollIntoView(pos, { y: 'center' }) });
      view.focus();
    },
    focus() {
      cm.current?.view?.focus();
    },
  }));

  const extensions = useMemo(
    () => [
      json(),
      syntaxHighlighting(classHighlighter),
      lintGutter(),
      // The parse already happens in the app; the linter just surfaces its result inline.
      linter(
        (view): Diagnostic[] => {
          const e = errorRef.current;
          if (!e) return [];
          const len = view.state.doc.length;
          const from = Math.max(0, Math.min(e.offset, len) - (e.offset >= len ? 1 : 0));
          return [{ from, to: Math.min(from + 1, len), severity: 'error', message: e.message }];
        },
        { delay: 150 },
      ),
      EditorView.lineWrapping,
    ],
    [],
  );

  return (
    <CodeMirror
      ref={cm}
      value={value}
      onChange={onChange}
      theme="none"
      height="100%"
      className="h-full"
      extensions={extensions}
      basicSetup={{ foldGutter: true, highlightActiveLine: true, bracketMatching: true, closeBrackets: true, autocompletion: false, tabSize: 2 }}
      placeholder="Paste or type JSON here, or drop a .json file anywhere…"
    />
  );
});
