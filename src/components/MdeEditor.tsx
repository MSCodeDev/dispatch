"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import {
  IconBold, IconItalic, IconStrikethrough, IconInlineCode,
  IconH1, IconH2, IconH3,
  IconBulletList, IconOrderedList, IconTaskListCheck, IconCodeBlock, IconTable,
} from "@/components/icons";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { Markdown } from "tiptap-markdown";

interface MdeEditorProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

type ToolbarBtn = {
  label: ReactNode;
  title: string;
  action: () => void;
  isActive?: boolean;
};

export default function MdeEditor({ value, onChange, compact = false }: MdeEditorProps) {
  const lastExternalValue = useRef(value);
  const [isInTable, setIsInTable] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: "Write your note in markdown..." }),
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "tiptap-editor-content",
        spellcheck: "true",
      },
    },
    onSelectionUpdate: ({ editor }) => setIsInTable(editor.isActive("table")),
    onUpdate: ({ editor }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (editor.storage as any).markdown.getMarkdown() as string;
      lastExternalValue.current = md;
      onChange(md);
      setIsInTable(editor.isActive("table"));
    },
  });

  // Sync externally-driven value changes (e.g. initial async load)
  useEffect(() => {
    if (!editor || value === lastExternalValue.current) return;
    lastExternalValue.current = value;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorMd = (editor.storage as any).markdown.getMarkdown() as string;
    if (editorMd !== value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  if (!editor) return null;

  const toolbarGroups: ToolbarBtn[][] = compact
    ? [
        [
          { label: <IconBold />,           title: "Bold",         action: () => editor.chain().focus().toggleBold().run(),                  isActive: editor.isActive("bold") },
          { label: <IconItalic />,         title: "Italic",       action: () => editor.chain().focus().toggleItalic().run(),                isActive: editor.isActive("italic") },
          { label: <IconStrikethrough />,  title: "Strikethrough", action: () => editor.chain().focus().toggleStrike().run(),               isActive: editor.isActive("strike") },
        ],
        [
          { label: <IconBulletList />,     title: "Bullet list",  action: () => editor.chain().focus().toggleBulletList().run(),            isActive: editor.isActive("bulletList") },
          { label: <IconOrderedList />,    title: "Ordered list", action: () => editor.chain().focus().toggleOrderedList().run(),           isActive: editor.isActive("orderedList") },
          { label: <IconTaskListCheck />,  title: "Checklist",    action: () => editor.chain().focus().toggleTaskList().run(),               isActive: editor.isActive("taskList") },
          { label: <IconCodeBlock />,      title: "Code block",   action: () => editor.chain().focus().toggleCodeBlock().run(),             isActive: editor.isActive("codeBlock") },
          { label: <IconTable />,          title: "Table",        action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), isActive: editor.isActive("table") },
        ],
      ]
    : [
        [
          { label: <IconBold />,           title: "Bold",          action: () => editor.chain().focus().toggleBold().run(),                 isActive: editor.isActive("bold") },
          { label: <IconItalic />,         title: "Italic",        action: () => editor.chain().focus().toggleItalic().run(),               isActive: editor.isActive("italic") },
          { label: <IconStrikethrough />,  title: "Strikethrough", action: () => editor.chain().focus().toggleStrike().run(),               isActive: editor.isActive("strike") },
          { label: <IconInlineCode />,     title: "Inline code",   action: () => editor.chain().focus().toggleCode().run(),                 isActive: editor.isActive("code") },
        ],
        [
          { label: <IconH1 />,             title: "Heading 1",     action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive("heading", { level: 1 }) },
          { label: <IconH2 />,             title: "Heading 2",     action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive("heading", { level: 2 }) },
          { label: <IconH3 />,             title: "Heading 3",     action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), isActive: editor.isActive("heading", { level: 3 }) },
        ],
        [
          { label: <IconBulletList />,     title: "Bullet list",   action: () => editor.chain().focus().toggleBulletList().run(),           isActive: editor.isActive("bulletList") },
          { label: <IconOrderedList />,    title: "Ordered list",  action: () => editor.chain().focus().toggleOrderedList().run(),          isActive: editor.isActive("orderedList") },
          { label: <IconTaskListCheck />,  title: "Checklist",     action: () => editor.chain().focus().toggleTaskList().run(),              isActive: editor.isActive("taskList") },
          { label: <IconCodeBlock />,      title: "Code block",    action: () => editor.chain().focus().toggleCodeBlock().run(),            isActive: editor.isActive("codeBlock") },
          { label: <IconTable />,          title: "Table",         action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), isActive: editor.isActive("table") },
        ],
      ];

  return (
    <div className={`tiptap-note-wrapper${compact ? " tiptap-note-wrapper--compact" : ""}`}>
      <div className="tiptap-toolbar">
        {toolbarGroups.map((group, gi) => (
          <div key={gi} className="tiptap-toolbar-group">
            {group.map((btn) => (
              <button
                key={btn.title}
                type="button"
                title={btn.title}
                onMouseDown={(e) => { e.preventDefault(); btn.action(); }}
                className={`tiptap-toolbar-btn${btn.isActive ? " active" : ""}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        ))}
      </div>
      {isInTable && editor && (
        <div className="table-context-toolbar">
          <div className="table-bubble-section">
            <span className="table-bubble-label">Row</span>
            <button type="button" title="Add row before" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowBefore().run(); }}>↑ Add</button>
            <button type="button" title="Add row after"  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }}>↓ Add</button>
            <button type="button" title="Delete row"     onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); }} className="table-bubble-delete">Delete</button>
          </div>
          <div className="table-bubble-sep" />
          <div className="table-bubble-section">
            <span className="table-bubble-label">Col</span>
            <button type="button" title="Add column before" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnBefore().run(); }}>← Add</button>
            <button type="button" title="Add column after"  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }}>→ Add</button>
            <button type="button" title="Delete column"     onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); }} className="table-bubble-delete">Delete</button>
          </div>
          <div className="table-bubble-sep" />
          <button type="button" title="Delete table" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }} className="table-bubble-delete table-bubble-delete--table">✕ Delete table</button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
