"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import { api, type Note } from "@/lib/client";
import { useToast } from "@/components/ToastProvider";
import { IconCheck, IconTrash } from "@/components/icons";

export function NoteEditor({ noteId }: { noteId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api.notes
      .get(noteId)
      .then((n) => {
        setNote(n);
        setTitle(n.title);
        setContent(n.content ?? "");
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [noteId]);

  const save = useCallback(
    async (t: string, c: string) => {
      setSaving(true);
      setSaved(false);
      try {
        const updated = await api.notes.update(noteId, {
          title: t.trim() || "Untitled Note",
          content: c,
        });
        setNote(updated);
        setSaved(true);
        if (savedTimeout.current) clearTimeout(savedTimeout.current);
        savedTimeout.current = setTimeout(() => setSaved(false), 2000);
      } catch {
        toast.error("Failed to save note");
      } finally {
        setSaving(false);
      }
    },
    [noteId, toast],
  );

  // Auto-save on changes (debounced 1s)
  function handleChange(newTitle: string, newContent: string) {
    setTitle(newTitle);
    setContent(newContent);
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => save(newTitle, newContent), 1000);
  }

  async function handleDelete() {
    if (!note) return;
    setDeleting(true);
    try {
      await api.notes.delete(note.id);
      toast.success("Note deleted");
      router.push("/notes");
    } catch {
      setDeleting(false);
      toast.error("Failed to delete note");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="space-y-4">
          <div className="h-8 w-64 rounded skeleton-shimmer" />
          <div className="h-96 rounded-lg skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center py-20">
        <svg className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
        <h1 className="text-xl font-bold dark:text-white">Note not found</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          This note may have been deleted.{" "}
          <button
            onClick={() => router.push("/notes")}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to notes
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/notes")}
          className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 active:scale-95 transition-all"
        >
          &larr; Back to notes
        </button>
        <div className="flex items-center gap-3">
          {/* Animated save status */}
          <div className="flex items-center gap-1.5 text-xs min-w-[70px] justify-end">
            {saving && (
              <span className="inline-flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500">
                <span className="inline-block w-3 h-3 border-2 border-neutral-300 dark:border-neutral-600 border-t-transparent rounded-full animate-spinner" />
                Saving
              </span>
            )}
            {!saving && saved && (
              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 animate-check-appear">
                <IconCheck className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`rounded-lg px-3 py-1.5 text-sm active:scale-95 transition-all ${
              showPreview
                ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                : "border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
            }`}
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg px-3 py-1.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 active:scale-95 transition-all inline-flex items-center gap-1.5"
          >
            {deleting ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spinner" />
            ) : (
              <IconTrash className="w-3.5 h-3.5" />
            )}
            Delete
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => handleChange(e.target.value, content)}
        placeholder="Note title..."
        className="w-full text-2xl font-bold border-none outline-none bg-transparent dark:text-white placeholder:text-neutral-300 dark:placeholder:text-neutral-600"
      />

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="prose prose-sm dark:prose-invert max-w-none rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 min-h-[400px] animate-fade-in-up">
          {content ? (
            <Markdown>{content}</Markdown>
          ) : (
            <p className="text-neutral-300 dark:text-neutral-600 italic">Nothing to preview.</p>
          )}
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => handleChange(title, e.target.value)}
          placeholder="Write your note in markdown..."
          className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 text-sm font-mono dark:text-neutral-200 min-h-[400px] resize-y focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
        />
      )}
    </div>
  );
}
