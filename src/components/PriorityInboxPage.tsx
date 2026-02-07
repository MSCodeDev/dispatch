"use client";

import { useEffect, useState, useCallback } from "react";
import {
  api,
  type Task,
  type TaskStatus,
  type TaskPriority,
  type Project,
} from "@/lib/client";
import { useToast } from "@/components/ToastProvider";
import { IconInbox } from "@/components/icons";
import { PROJECT_COLORS } from "@/lib/projects";

const STATUS_STYLES: Record<TaskStatus, { dot: string; label: string; ring: string }> = {
  open: { dot: "bg-blue-500", label: "Open", ring: "text-blue-500" },
  in_progress: { dot: "bg-yellow-500", label: "In Progress", ring: "text-yellow-500" },
  done: { dot: "bg-green-500", label: "Done", ring: "text-green-500" },
};

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  low: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PriorityInboxPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashingId, setFlashingId] = useState<string | null>(null);

  const today = todayStr();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.tasks.list();
      setTasks(Array.isArray(data) ? data : data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    let active = true;
    api.projects.list().then((data) => {
      if (!active) return;
      setProjects(Array.isArray(data) ? data : data.data);
    });
    return () => {
      active = false;
    };
  }, []);

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const sortByPriority = (a: Task, b: Task) =>
    PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];

  const overdueTasks = tasks
    .filter((t) => t.dueDate && t.dueDate < today && t.status !== "done")
    .sort(sortByPriority);

  const dueTodayTasks = tasks
    .filter((t) => t.dueDate === today && t.status !== "done")
    .sort(sortByPriority);

  const highPriorityNoDueTasks = tasks
    .filter((t) => !t.dueDate && t.priority === "high" && t.status !== "done")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const totalCount = overdueTasks.length + dueTodayTasks.length + highPriorityNoDueTasks.length;

  async function handleStatusToggle(task: Task) {
    const next: TaskStatus =
      task.status === "open"
        ? "in_progress"
        : task.status === "in_progress"
          ? "done"
          : "open";

    setFlashingId(task.id);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)),
    );
    setTimeout(() => setFlashingId(null), 600);

    try {
      await api.tasks.update(task.id, { status: next });
    } catch {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: task.status } : t,
        ),
      );
      toast.error("Failed to update task status");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="space-y-4">
          <div className="h-8 w-64 rounded skeleton-shimmer" />
          <div className="h-32 rounded-xl skeleton-shimmer" />
          <div className="h-48 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <IconInbox className="w-7 h-7 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Priority Inbox</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {formatDate(today)} &middot; {totalCount} {totalCount === 1 ? "item" : "items"} need attention
            </p>
          </div>
        </div>
      </div>

      {totalCount === 0 ? (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center">
          <IconInbox className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-4" />
          <h2 className="text-lg font-semibold dark:text-white mb-1">All clear</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Nothing due today and no overdue tasks. Nice work!
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <Section
              label="Overdue"
              count={overdueTasks.length}
              className="text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10"
            >
              {overdueTasks.map((task, i) => (
                <InboxTaskRow
                  key={task.id}
                  task={task}
                  project={task.projectId ? projectMap.get(task.projectId) ?? null : null}
                  index={i}
                  isFlashing={flashingId === task.id}
                  onStatusToggle={() => handleStatusToggle(task)}
                />
              ))}
            </Section>
          )}

          {/* Due Today */}
          {dueTodayTasks.length > 0 && (
            <Section
              label="Due Today"
              count={dueTodayTasks.length}
              className="text-yellow-600 dark:text-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10"
            >
              {dueTodayTasks.map((task, i) => (
                <InboxTaskRow
                  key={task.id}
                  task={task}
                  project={task.projectId ? projectMap.get(task.projectId) ?? null : null}
                  index={i}
                  isFlashing={flashingId === task.id}
                  onStatusToggle={() => handleStatusToggle(task)}
                />
              ))}
            </Section>
          )}

          {/* High Priority (no due date) */}
          {highPriorityNoDueTasks.length > 0 && (
            <Section
              label="High Priority"
              count={highPriorityNoDueTasks.length}
              className="text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
            >
              {highPriorityNoDueTasks.map((task, i) => (
                <InboxTaskRow
                  key={task.id}
                  task={task}
                  project={task.projectId ? projectMap.get(task.projectId) ?? null : null}
                  index={i}
                  isFlashing={flashingId === task.id}
                  onStatusToggle={() => handleStatusToggle(task)}
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  count,
  className,
  children,
}: {
  label: string;
  count: number;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={`px-4 py-2 text-xs font-medium uppercase tracking-wide ${className}`}>
        {label} ({count})
      </p>
      {children}
    </div>
  );
}

function InboxTaskRow({
  task,
  project,
  index,
  isFlashing,
  onStatusToggle,
}: {
  task: Task;
  project: Project | null;
  index: number;
  isFlashing: boolean;
  onStatusToggle: () => void;
}) {
  const [ringKey, setRingKey] = useState(0);

  function handleStatusClick() {
    setRingKey((k) => k + 1);
    onStatusToggle();
  }

  return (
    <div
      className={`group flex items-center gap-3 p-4 transition-all duration-200 ${
        index > 0 ? "border-t border-neutral-100 dark:border-neutral-800/50" : ""
      } ${
        task.status === "done" ? "opacity-60" : ""
      } ${
        isFlashing ? "animate-row-flash" : ""
      } hover:bg-neutral-50 dark:hover:bg-neutral-800/30`}
    >
      <button
        onClick={handleStatusClick}
        title={`Status: ${STATUS_STYLES[task.status].label} (click to cycle)`}
        className="flex-shrink-0 inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-700 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-600 hover:text-neutral-800 dark:hover:text-neutral-100 transition-all active:scale-95"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`absolute inset-0 rounded-full ${STATUS_STYLES[task.status].dot} transition-colors`}
          />
          {ringKey > 0 && (
            <span
              key={ringKey}
              className={`absolute inset-0 rounded-full animate-status-ring ${STATUS_STYLES[task.status].ring}`}
            />
          )}
        </span>
        <span>{STATUS_STYLES[task.status].label}</span>
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate dark:text-white ${task.status === "done" ? "line-through" : ""}`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {project && (
          <span
            title={`Project: ${project.name}`}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
              PROJECT_COLORS[project.color]?.badge ?? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${PROJECT_COLORS[project.color]?.dot ?? "bg-neutral-400"}`} />
            {project.name}
          </span>
        )}
        <span
          title={`Priority: ${task.priority}`}
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority]}`}
        >
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
            {task.dueDate}
          </span>
        )}
      </div>
    </div>
  );
}
