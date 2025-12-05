"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import CodeBlock from "@tiptap/extension-code-block";
import Blockquote from "@tiptap/extension-blockquote";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

type Props = {
  value?: string;
  onChange?: (html: string) => void;
};

export default function EditorField({ value, onChange }: Props) {
  const editor = useEditor({
    content: value || "",
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Placeholder.configure({ placeholder: "Escribe tu respuesta…" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: true }),
      CodeBlock,
      Blockquote,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  // paste handler to insert clipboard images as base64
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items || !editor) return;
    for (const item of Array.from(items)) {
      if (item.type?.startsWith("image")) {
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = () => {
          editor
            .chain()
            .focus()
            .setImage({ src: String(reader.result) })
            .run();
        };
        reader.readAsDataURL(file);
        e.preventDefault();
      }
    }
  };

  if (!editor) return null;

  // small helper for font-size via textStyle mark
  const setFontSize = (size: string) => {
    editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
  };

  // clear formatting helper
  const clearFormatting = () => {
    editor.chain().focus().unsetAllMarks().clearNodes().run();
  };

  // table helpers
  const insertTable = (rows = 2, cols = 3) => {
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
  };

  return (
    <div className="border rounded-lg bg-white">
      {/* TOOLBAR */}
      <div className="flex flex-wrap gap-2 p-2 border-b bg-gray-50">
        {/* Font group */}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded ${
              editor.isActive("bold") ? "bg-blue-200" : "bg-white"
            }`}
            title="Bold (Ctrl/Cmd+B)"
          >
            <b>B</b>
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded ${
              editor.isActive("italic") ? "bg-blue-200" : "bg-white"
            }`}
            title="Italic (Ctrl/Cmd+I)"
          >
            <i>I</i>
          </button>

          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-2 py-1 rounded ${
              editor.isActive("underline") ? "bg-blue-200" : "bg-white"
            }`}
            title="Underline"
          >
            <u>U</u>
          </button>

          <select
            className="border rounded px-2 py-1"
            onChange={(e) => setFontSize(e.target.value)}
            defaultValue=""
            title="Tamaño de fuente"
          >
            <option value="">Tamaño</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="24px">24</option>
            <option value="32px">32</option>
          </select>
        </div>

        {/* Paragraph / alignment */}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className="px-2 py-1 rounded"
            title="Align left"
          >
            ⬅
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className="px-2 py-1 rounded"
            title="Center"
          >
            ⬆
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className="px-2 py-1 rounded"
            title="Align right"
          >
            ➡
          </button>
        </div>

        {/* Lists, headings */}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 rounded ${
              editor.isActive("bulletList") ? "bg-blue-200" : "bg-white"
            }`}
            title="Bullet list"
          >
            •
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2 py-1 rounded ${
              editor.isActive("orderedList") ? "bg-blue-200" : "bg-white"
            }`}
            title="Ordered list"
          >
            1.
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className="px-2 py-1 rounded"
            title="H1"
          >
            H1
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className="px-2 py-1 rounded"
            title="H2"
          >
            H2
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className="px-2 py-1 rounded"
            title="H3"
          >
            H3
          </button>
        </div>

        {/* Colors / highlight */}
        <div className="flex gap-1 items-center">
          <input
            type="color"
            title="Color de texto"
            onChange={(e) =>
              editor
                .chain()
                .focus()
                .setMark("textStyle", { color: e.target.value })
                .run()
            }
            className="w-8 h-6 p-0 border rounded"
          />
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className="px-2 py-1 rounded bg-yellow-200"
            title="Highlight"
          >
            🔆
          </button>
        </div>

        {/* Links / images / code / quote */}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => {
              const url = window.prompt("Ingrese la URL:");
              if (url)
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: url })
                  .run();
            }}
            className="px-2 py-1 rounded"
            title="Insert link"
          >
            🔗
          </button>

          <button
            onClick={() => {
              const url = window.prompt(
                "URL de la imagen (o pega imagen en el editor)"
              );
              if (url) editor.chain().focus().setImage({ src: url }).run();
            }}
            className="px-2 py-1 rounded"
            title="Insert image by URL"
          >
            🖼
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className="px-2 py-1 rounded"
            title="Code block"
          >{`</>`}</button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className="px-2 py-1 rounded"
            title="Blockquote"
          >
            ❝
          </button>
        </div>

        {/* Tables */}
        <div className="flex gap-1 items-center">
          <button
            onClick={() => insertTableHelper(editor)}
            className="px-2 py-1 rounded"
            title="Insert table"
          >
            ⤷ Table
          </button>
        </div>

        {/* Undo / Redo / Clear */}
        <div className="flex gap-1 items-center ml-auto">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            className="px-2 py-1 rounded"
            title="Undo"
          >
            ↶
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            className="px-2 py-1 rounded"
            title="Redo"
          >
            ↷
          </button>
          <button
            onClick={() => clearFormattingHelper(editor)}
            className="px-2 py-1 rounded"
            title="Clear formatting"
          >
            ✖
          </button>
        </div>
      </div>

      {/* EDITOR AREA (handles paste for images) */}
      <div onPaste={handlePaste}>
        <EditorContent editor={editor} className="min-h-[240px] p-4" />
      </div>
    </div>
  );
}

/**
 * Helpers extracted to keep toolbar JSX readable
 */
function insertTableHelper(editor: any) {
  // default 2x3 with header
  editor
    .chain()
    .focus()
    .insertTable({ rows: 2, cols: 3, withHeaderRow: true })
    .run();
}

function clearFormattingHelper(editor: any) {
  // unset marks and reset node types (paragraph)
  editor.chain().focus().unsetAllMarks().clearNodes().setParagraph().run();
}
