"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type Task, type Note, type Project, type TaskStatus } from "@/lib/client";
import {
  IconDocument,
  IconCalendar,
  IconSearch,
  IconList,
  IconGrid,
  IconFolder,
} from "@/components/icons";

const STATUS_BADGES: Record<TaskStatus, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export function Dashboard({ userName }: { userName: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.tasks.list(),
      api.notes.list(),
      api.projects.list(),
    ])
      .then(([t, n, p]) => {
        if (!active) return;
        setTasks(Array.isArray(t) ? t : t.data);
        setNotes(Array.isArray(n) ? n : n.data);
        setProjects(Array.isArray(p) ? p : p.data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openTasks = tasks.filter((t) => t.status === "open");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const today = new Date().toISOString().split("T")[0];
  const focusWindowDays = 7;
  const focusEnd = new Date();
  focusEnd.setDate(focusEnd.getDate() + focusWindowDays);
  const focusEndIso = focusEnd.toISOString().split("T")[0];
  const overdue = tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== "done",
  );
  const dueToday = tasks.filter(
    (t) => t.dueDate?.startsWith(today) && t.status !== "done",
  );
  const dueSoon = tasks.filter(
    (t) => t.dueDate && t.dueDate > today && t.dueDate <= focusEndIso && t.status !== "done",
  );
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartTime = weekStart.getTime();
  const notesThisWeek = notes.filter(
    (n) => new Date(n.updatedAt).getTime() >= weekStartTime,
  ).length;
  const upcoming = tasks
    .filter((t) => t.dueDate && t.dueDate > today && t.status !== "done")
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, 5);

  type ActivityItem = {
    id: string;
    type: "task" | "note";
    title: string;
    date: string;
    status?: TaskStatus;
  };

  const recentActivity: ActivityItem[] = [
    ...tasks.map((t) => ({
      id: `task-${t.id}`,
      type: "task" as const,
      title: t.title,
      date: t.updatedAt,
      status: t.status,
    })),
    ...notes.map((n) => ({
      id: `note-${n.id}`,
      type: "note" as const,
      title: n.title,
      date: n.updatedAt,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const recentTaskActivity = recentActivity.filter((item) => item.type === "task").slice(0, 4);
  const recentNoteActivity = recentActivity.filter((item) => item.type === "note").slice(0, 4);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="space-y-6">
          <div className="h-8 w-48 rounded skeleton-shimmer" />
          {/* Quick Actions skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl skeleton-shimmer" />
            ))}
          </div>
          {/* Stat cards skeleton */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl skeleton-shimmer" />
            ))}
          </div>
          {/* KPI strip skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 rounded-xl skeleton-shimmer" />
            ))}
          </div>
          {/* Content skeleton */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="h-5 w-24 rounded skeleton-shimmer" />
              <div className="h-16 rounded-lg skeleton-shimmer" />
              <div className="h-16 rounded-lg skeleton-shimmer" />
            </div>
            <div className="space-y-3">
              <div className="h-5 w-28 rounded skeleton-shimmer" />
              <div className="h-16 rounded-lg skeleton-shimmer" />
              <div className="h-16 rounded-lg skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8">
      <div className="flex items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <IconGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Dashboard</h1>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          title="Search (Ctrl+K)"
          className="group flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400 p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:text-neutral-700 dark:hover:text-neutral-200 active:scale-95"
        >
          <IconSearch className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <Link
          href="/tasks"
          className="group relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-900/20 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{tasks.length}</p>
              <p className="text-sm font-medium mt-1 text-blue-600 dark:text-blue-400">Tasks</p>
              <p className="mt-2 text-xs text-blue-500/70 dark:text-blue-400/60">{openTasks.length} open · {inProgressTasks.length} in progress</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-105">
              <IconList className="w-4 h-4" />
            </span>
          </div>
        </Link>
        <Link
          href="/notes"
          className="group relative overflow-hidden rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-900/20 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{notes.length}</p>
              <p className="text-sm font-medium mt-1 text-purple-600 dark:text-purple-400">Notes</p>
              <p className="mt-2 text-xs text-purple-500/70 dark:text-purple-400/60">{notesThisWeek} updated this week</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 transition-transform duration-300 group-hover:scale-105">
              <IconDocument className="w-4 h-4" />
            </span>
          </div>
        </Link>
        <Link
          href="/projects"
          className="group relative overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/20 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{projects.length}</p>
              <p className="text-sm font-medium mt-1 text-emerald-600 dark:text-emerald-400">Projects</p>
              <p className="mt-2 text-xs text-emerald-500/70 dark:text-emerald-400/60">{projects.filter(p => p.status === "active").length} active · {projects.filter(p => p.status === "completed").length} completed</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-105">
              <IconFolder className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </div>

      {/* Upcoming */}
      <section className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
        <h2 className="text-lg font-semibold mb-3 dark:text-white">Upcoming</h2>
        {overdue.length === 0 && dueToday.length === 0 && upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
            <IconCalendar className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-400 dark:text-neutral-500">No upcoming deadlines</p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            {overdue.map((t, i) => (
              <DueItem key={t.id} task={t} badge="Overdue" badgeColor="red" index={i} />
            ))}
            {dueToday.map((t, i) => (
              <DueItem key={t.id} task={t} badge="Today" badgeColor="yellow" index={overdue.length + i} />
            ))}
            {upcoming.map((t, i) => (
              <DueItem key={t.id} task={t} index={overdue.length + dueToday.length + i} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section className="animate-fade-in-up" style={{ animationDelay: "250ms" }}>
        <div className="mb-3">
          <h2 className="text-lg font-semibold dark:text-white">Recent Activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
            <IconCalendar className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-400 dark:text-neutral-500">No activity yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActivityCard
              title="Task Activity"
              emptyMessage="No task updates in this window."
              items={recentTaskActivity}
            />
            <ActivityCard
              title="Note Activity"
              emptyMessage="No note updates in this window."
              items={recentNoteActivity}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function ActivityCard({
  title,
  emptyMessage,
  items,
}: {
  title: string;
  emptyMessage: string;
  items: Array<{
    id: string;
    type: "task" | "note";
    title: string;
    date: string;
    status?: TaskStatus;
  }>;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-neutral-400 dark:text-neutral-500">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const dotClass =
              item.type === "note"
                ? "bg-purple-500"
                : item.status === "done"
                  ? "bg-green-500"
                  : item.status === "in_progress"
                    ? "bg-yellow-500"
                    : "bg-blue-500";

            const label =
              item.type === "note"
                ? "Updated note"
                : item.status === "done"
                  ? "Completed task"
                  : "Updated task";

            return (
              <li
                key={item.id}
                className="rounded-lg border border-neutral-200/70 dark:border-neutral-800/80 bg-neutral-50/70 dark:bg-neutral-950/40 px-3 py-2"
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 rounded-full ${dotClass}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                      <span className="font-medium">{label}:</span> {item.title}
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {new Date(item.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function DueItem({
  task,
  badge,
  badgeColor,
  index,
}: {
  task: Task;
  badge?: string;
  badgeColor?: "red" | "yellow";
  index: number;
}) {
  const badgeColors = {
    red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  };
  return (
    <div
      className={`flex items-center gap-2 p-3 transition-all duration-300 hover:-translate-y-px hover:bg-neutral-50 dark:hover:bg-neutral-800/30 ${
        index > 0 ? "border-t border-neutral-100 dark:border-neutral-800/50" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate dark:text-white">{task.title}</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          Due {task.dueDate}
        </p>
      </div>
      {badge && badgeColor && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColors[badgeColor]}`}>
          {badge}
        </span>
      )}
    </div>
  );
}
