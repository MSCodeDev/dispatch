"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { api, type Project, type ProjectStatus } from "@/lib/client";
import { CustomSelect } from "@/components/CustomSelect";
import { PROJECT_COLOR_OPTIONS, PROJECT_STATUS_OPTIONS } from "@/lib/projects";

export function ProjectModal({
  project,
  onClose,
  onSaved,
  onDelete,
}: {
  project: Project | null;
  onClose: () => void;
  onSaved: () => void;
  onDelete?: () => Promise<void>;
}) {
  const isEditing = project !== null;

  const [name, setName] = useState(project?.name ?? "");
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "active",
  );
  const [color, setColor] = useState(project?.color ?? "blue");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (isEditing) {
        await api.projects.update(project.id, {
          name: name.trim(),
          status,
          color,
        });
      } else {
        await api.projects.create({
          name: name.trim(),
          status,
          color,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto px-4 py-8 sm:py-12">
      <div
        className="absolute inset-0 bg-black/40 animate-backdrop-enter"
        onClick={onClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative my-auto w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900 space-y-4 animate-modal-enter"
      >
        <h2 className="text-lg font-semibold dark:text-white">
          {isEditing ? "Edit Project" : "New Project"}
        </h2>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CustomSelect
            label="Status"
            value={status}
            onChange={(v: string) => setStatus(v as ProjectStatus)}
            options={PROJECT_STATUS_OPTIONS}
          />
          <CustomSelect
            label="Color"
            value={color}
            onChange={(v: string) => setColor(v)}
            options={PROJECT_COLOR_OPTIONS}
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <div>
            {isEditing && onDelete && (
              <button
                type="button"
                disabled={deleting}
                onClick={async () => {
                  if (!deleteConfirm) {
                    setDeleteConfirm(true);
                    setTimeout(() => setDeleteConfirm(false), 2500);
                    return;
                  }
                  setDeleting(true);
                  await onDelete();
                  setDeleting(false);
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-95 inline-flex items-center gap-2 disabled:opacity-50 ${
                  deleteConfirm
                    ? "bg-red-600 text-white hover:bg-red-500"
                    : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                }`}
              >
                {deleting && (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spinner" />
                )}
                {deleting ? "Deleting..." : deleteConfirm ? "Confirm delete" : "Delete project"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-sm font-medium text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 active:scale-95 transition-all inline-flex items-center gap-2"
            >
              {saving && (
                <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spinner" />
              )}
              {saving ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}
