"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { $getRoot } from "lexical";

interface LexicalEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function LexicalEditor({
  value = "",
  onChange,
}: LexicalEditorProps) {
  const initialConfig = {
    namespace: "Editor",
    onError(error: any) {
      console.error("Lexical Error:", error);
    },
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border rounded-xl p-3 bg-white shadow-sm relative">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-[200px] p-2 outline-none" />
          }
          placeholder={
            <div className="absolute top-3 left-4 text-gray-400">
              Escribe aquí…
            </div>
          }
          ErrorBoundary={({ children }) => <>{children}</>}
        />

        <HistoryPlugin />

        <OnChangePlugin
          onChange={(editorState) => {
            editorState.read(() => {
              const textOnly = $getRoot().getTextContent();
              onChange?.(textOnly);
            });
          }}
        />
      </div>
    </LexicalComposer>
  );
}
