"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type Task, type Note, type TaskStatus, type ProjectWithStats } from "@/lib/client";
import { PROJECT_COLORS } from "@/lib/projects";
import {
  IconPlus,
  IconDocument,
  IconCalendar,
  IconSearch,
  IconList,
} from "@/components/icons";

const STATUS_BADGES: Record<TaskStatus, string> = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export function Dashboard({ userName }: { userName: string }) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [dispatchCount, setDispatchCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowSkeleton(true), 120);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.tasks.list(),
      api.notes.list(),
      api.dispatches.list({ page: 1, limit: 1 }),
      api.projects.listWithStats({ status: "active" }),
    ])
      .then(([t, n, d, p]) => {
        if (!active) return;
        setTasks(Array.isArray(t) ? t : t.data);
        setNotes(Array.isArray(n) ? n : n.data);
        if (Array.isArray(d)) {
          setDispatchCount(d.length);
        } else {
          setDispatchCount(d.pagination.total);
        }
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
  const doneThisWeek = tasks.filter(
    (t) => t.status === "done" && new Date(t.updatedAt).getTime() >= weekStartTime,
  ).length;
  const notesThisWeek = notes.filter(
    (n) => new Date(n.updatedAt).getTime() >= weekStartTime,
  ).length;
  const backlogTasks = tasks.filter((t) => !t.dueDate && t.status !== "done").length;
  const activeProjectsCount = projects.length;
  const upcoming = tasks
    .filter((t) => t.dueDate && t.dueDate > today && t.status !== "done")
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, 5);

  const recentNotes = [...notes]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
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
      type: "task",
      title: t.title,
      date: t.updatedAt,
      status: t.status,
    })),
    ...notes.map((n) => ({
      id: `note-${n.id}`,
      type: "note",
      title: n.title,
      date: n.updatedAt,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const projectMap = new Map(projects.map((project) => [project.id, project]));

  const topProjects = [...projects]
    .filter((project) => project.stats.total > 0)
    .sort((a, b) => b.stats.total - a.stats.total)
    .slice(0, 3);

  const recentProjectActivity = [...tasks]
    .filter((task) => Boolean(task.projectId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4)
    .map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      projectName: projectMap.get(task.projectId || "")?.name ?? "Project",
      updatedAt: task.updatedAt,
    }));

  // Deadline focus calculation (next 7 days)
  const focusTasks = tasks.filter((t) => t.dueDate && t.dueDate <= focusEndIso);
  const focusDone = focusTasks.filter((t) => t.status === "done");
  const focusPercent = focusTasks.length > 0 ? Math.round((focusDone.length / focusTasks.length) * 100) : 100;
  const focusLabel = focusTasks.length > 0 ? `${focusDone.length}/${focusTasks.length}` : "Clear";
  const focusHeadline = focusTasks.length > 0 ? `${focusPercent}%` : "All clear";
  const focusSubtext = focusTasks.length > 0
    ? `Resolved ${focusDone.length} of ${focusTasks.length} due in next ${focusWindowDays} days`
    : `No tasks due in next ${focusWindowDays} days`;
  const focusTone =
    overdue.length > 0
      ? "text-red-500 dark:text-red-400"
      : dueToday.length > 0
        ? "text-amber-500 dark:text-amber-400"
        : dueSoon.length > 0
          ? "text-emerald-500 dark:text-emerald-400"
          : "text-neutral-400 dark:text-neutral-500";

  if (loading && showSkeleton) {
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
  if (loading) {
    return <div className="mx-auto max-w-5xl p-6" />;
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-8">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold dark:text-white">Dashboard</h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">Welcome back, {userName}.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
        <QuickAction
          label="New Task"
          icon={IconPlus}
          onClick={() => {
            window.dispatchEvent(new CustomEvent("shortcut:new-task"));
            router.push("/tasks");
          }}
          color="blue"
        />
        <QuickAction
          label="New Note"
          icon={IconDocument}
          onClick={() => {
            window.dispatchEvent(new CustomEvent("shortcut:new-note"));
            router.push("/notes");
          }}
          color="purple"
        />
        <QuickAction
          label="Dispatch"
          icon={IconCalendar}
          onClick={() => router.push("/dispatch")}
          color="green"
        />
        <QuickAction
          label="Search"
          icon={IconSearch}
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
          color="neutral"
        />
      </div>

      {/* Stats row with progress ring */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <StatCard
          label="Open Tasks"
          count={openTasks.length}
          color="blue"
          href="/tasks?status=open"
          icon={IconList}
        />
        <StatCard
          label="Notes"
          count={notes.length}
          color="purple"
          href="/notes"
          icon={IconDocument}
        />
        <StatCard
          label="Dispatches"
          count={dispatchCount}
          color="green"
          href="/dispatch"
          icon={IconCalendar}
        />
        <div className="group relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white via-white to-emerald-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-emerald-950/40 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-emerald-200/70 dark:hover:border-emerald-700/40">
          <div className="pointer-events-none absolute -top-10 right-6 h-24 w-24 rounded-full bg-emerald-400/20 blur-2xl dark:bg-emerald-500/20" />
          <div className="pointer-events-none absolute -bottom-10 left-6 h-24 w-24 rounded-full bg-blue-300/20 blur-2xl dark:bg-blue-500/10" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                Deadline Focus
              </p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">
                {focusHeadline}
              </p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {focusSubtext}
              </p>
            </div>
            <FocusRing percent={focusPercent} toneClass={focusTone} label={focusLabel} />
          </div>
          <div className="relative mt-3 grid grid-cols-3 gap-2 text-[11px] font-medium">
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-red-700 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-300">
              Overdue {overdue.length}
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/30 dark:text-amber-300">
              Due today {dueToday.length}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/30 dark:text-emerald-300">
              Due soon {dueSoon.length}
            </span>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <InsightCard
          label="In Progress"
          value={inProgressTasks.length}
          tone="amber"
          subtext="Active tasks"
          href="/tasks?status=in_progress"
        />
        <InsightCard
          label="Overdue"
          value={overdue.length}
          tone="red"
          subtext="Needs attention"
        />
        <InsightCard
          label="Done (7d)"
          value={doneThisWeek}
          tone="emerald"
          subtext="Closed this week"
        />
        <InsightCard
          label="Notes (7d)"
          value={notesThisWeek}
          tone="violet"
          subtext="Updated this week"
          href="/notes"
        />
        <InsightCard
          label="Backlog"
          value={backlogTasks}
          tone="slate"
          subtext="No due date"
        />
        <InsightCard
          label="Active Projects"
          value={activeProjectsCount}
          tone="blue"
          subtext="In flight"
          href="/projects"
        />
      </div>

      {/* Project signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: "130ms" }}>
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Active Projects</h2>
            <Link href="/projects" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </div>
          {topProjects.length === 0 ? (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">No active projects yet</p>
          ) : (
            <div className="space-y-2">
              {topProjects.map((project) => {
                const color = PROJECT_COLORS[project.color]?.dot ?? "bg-blue-500";
                const barColor = PROJECT_COLORS[project.color]?.dot ?? "bg-blue-500";
                const percent = project.stats.total > 0
                  ? Math.round((project.stats.done / project.stats.total) * 100)
                  : 0;
                return (
                  <div
                    key={project.id}
                    className="space-y-1 rounded-lg p-2 -mx-2 transition-all duration-300 hover:-translate-y-px hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-2 w-2 rounded-full ${color}`} />
                        <span className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                          {project.name}
                        </span>
                      </div>
                      <span className="text-neutral-400 dark:text-neutral-500">
                        {project.stats.done}/{project.stats.total}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor} opacity-80 transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Recent Project Activity</h2>
            <Link href="/projects" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Projects
            </Link>
          </div>
          {recentProjectActivity.length === 0 ? (
            <p className="text-xs text-neutral-400 dark:text-neutral-500">No project activity yet</p>
          ) : (
            <div className="space-y-1">
              {recentProjectActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 text-xs rounded-lg p-2 -mx-2 transition-all duration-300 hover:-translate-y-px hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                >
                  <div className="min-w-0">
                    <p className="text-neutral-500 dark:text-neutral-400">{item.projectName}</p>
                    <p className="font-medium text-neutral-700 dark:text-neutral-300 truncate">
                      {item.title}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGES[item.status]}`}>
                    {item.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Due dates */}
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

        {/* Recent notes */}
        <section className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold dark:text-white">Recent Notes</h2>
            <Link href="/notes" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </div>
          {recentNotes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
              <IconDocument className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
              <p className="text-sm text-neutral-400 dark:text-neutral-500">No notes yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              {recentNotes.map((n, i) => (
                <Link
                  key={n.id}
                  href={`/notes/${n.id}`}
                  className={`block p-3 transition-all duration-300 hover:-translate-y-px hover:bg-neutral-50 dark:hover:bg-neutral-800/30 ${
                    i > 0 ? "border-t border-neutral-100 dark:border-neutral-800/50" : ""
                  }`}
                >
                  <p className="font-medium text-sm truncate dark:text-white">{n.title}</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    {new Date(n.updatedAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent Activity */}
      <section className="animate-fade-in-up" style={{ animationDelay: "250ms" }}>
        <h2 className="text-lg font-semibold mb-3 dark:text-white">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center">
            <IconCalendar className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-400 dark:text-neutral-500">No activity yet</p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <ul className="border-l border-neutral-200 dark:border-neutral-800/70 pl-6 space-y-4">
              {recentActivity.map((item) => {
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
                  <li key={item.id} className="relative">
                    <span
                      className={`absolute -left-[12px] top-1.5 h-2.5 w-2.5 rounded-full ${dotClass}`}
                    />
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">
                      <span className="font-medium">{label}:</span>{" "}
                      <span className="text-neutral-600 dark:text-neutral-300">{item.title}</span>
                    </p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {new Date(item.date).toLocaleString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function QuickAction({
  label,
  icon: Icon,
  onClick,
  color,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color: "blue" | "purple" | "green" | "neutral";
}) {
  const colors = {
    blue: {
      base: "text-blue-700 dark:text-blue-300 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-neutral-900 border-blue-200/80 dark:border-blue-800/60",
      glow: "from-blue-200/70 via-transparent to-transparent dark:from-blue-500/20",
    },
    purple: {
      base: "text-purple-700 dark:text-purple-300 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-neutral-900 border-purple-200/80 dark:border-purple-800/60",
      glow: "from-purple-200/70 via-transparent to-transparent dark:from-purple-500/20",
    },
    green: {
      base: "text-emerald-700 dark:text-emerald-300 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-neutral-900 border-emerald-200/80 dark:border-emerald-800/60",
      glow: "from-emerald-200/70 via-transparent to-transparent dark:from-emerald-500/20",
    },
    neutral: {
      base: "text-neutral-700 dark:text-neutral-300 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900/50 dark:to-neutral-900 border-neutral-200 dark:border-neutral-700",
      glow: "from-neutral-200/70 via-transparent to-transparent dark:from-neutral-500/10",
    },
  };

  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-2.5 rounded-xl border p-3.5 text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${colors[color].base}`}
    >
      <span
        className={`pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br ${colors[color].glow} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
      />
      <Icon className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105" />
      {label}
    </button>
  );
}

function FocusRing({
  percent,
  toneClass,
  label,
}: {
  percent: number;
  toneClass: string;
  label: string;
}) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="flex-shrink-0 -rotate-90">
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        className="text-neutral-200 dark:text-neutral-800/80"
      />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        stroke="currentColor"
        className={`transition-all duration-500 ${toneClass}`}
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
      <text
        x="28"
        y="28"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] font-semibold fill-neutral-700 dark:fill-neutral-300 rotate-90 origin-center"
      >
        {label}
      </text>
    </svg>
  );
}

function StatCard({
  label,
  count,
  color,
  href,
  icon: Icon,
}: {
  label: string;
  count: number;
  color: "blue" | "yellow" | "green" | "purple";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const colors = {
    blue: {
      text: "text-blue-700 dark:text-blue-300",
      accent: "bg-blue-500",
      border: "border-blue-200/80 dark:border-blue-800/60",
      glow: "bg-blue-400/20 dark:bg-blue-500/10",
      iconBg: "bg-blue-50 dark:bg-blue-900/30",
      iconText: "text-blue-600 dark:text-blue-300",
      hover: "hover:border-blue-300/80 dark:hover:border-blue-500/40",
    },
    yellow: {
      text: "text-amber-700 dark:text-amber-300",
      accent: "bg-amber-500",
      border: "border-amber-200/80 dark:border-amber-800/60",
      glow: "bg-amber-400/20 dark:bg-amber-500/10",
      iconBg: "bg-amber-50 dark:bg-amber-900/30",
      iconText: "text-amber-600 dark:text-amber-300",
      hover: "hover:border-amber-300/80 dark:hover:border-amber-500/40",
    },
    green: {
      text: "text-emerald-700 dark:text-emerald-300",
      accent: "bg-emerald-500",
      border: "border-emerald-200/80 dark:border-emerald-800/60",
      glow: "bg-emerald-400/20 dark:bg-emerald-500/10",
      iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
      iconText: "text-emerald-600 dark:text-emerald-300",
      hover: "hover:border-emerald-300/80 dark:hover:border-emerald-500/40",
    },
    purple: {
      text: "text-purple-700 dark:text-purple-300",
      accent: "bg-purple-500",
      border: "border-purple-200/80 dark:border-purple-800/60",
      glow: "bg-purple-400/20 dark:bg-purple-500/10",
      iconBg: "bg-purple-50 dark:bg-purple-900/30",
      iconText: "text-purple-600 dark:text-purple-300",
      hover: "hover:border-purple-300/80 dark:hover:border-purple-500/40",
    },
  };
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-xl border bg-white dark:bg-neutral-900 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${colors[color].border} ${colors[color].hover}`}
    >
      <span className={`absolute inset-x-0 top-0 h-0.5 ${colors[color].accent}`} />
      <span
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${colors[color].glow} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-3xl font-bold ${colors[color].text}`}>{count}</p>
          <p className="text-sm font-medium mt-1 text-neutral-600 dark:text-neutral-300">{label}</p>
          <p className="mt-2 text-[11px] text-neutral-400 dark:text-neutral-500">View details</p>
        </div>
        <span
          className={`rounded-lg p-2 ${colors[color].iconBg} ${colors[color].iconText} transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105`}
        >
          <Icon className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}

function InsightCard({
  label,
  value,
  subtext,
  tone,
  href,
}: {
  label: string;
  value: number;
  subtext: string;
  tone: "amber" | "red" | "emerald" | "violet" | "slate" | "blue";
  href?: string;
}) {
  const tones = {
    amber: {
      dot: "bg-amber-500",
      border: "border-amber-200/70 dark:border-amber-900/50",
      text: "text-amber-700 dark:text-amber-300",
      glow: "from-amber-200/70 via-transparent to-transparent dark:from-amber-500/20",
    },
    red: {
      dot: "bg-red-500",
      border: "border-red-200/70 dark:border-red-900/50",
      text: "text-red-700 dark:text-red-300",
      glow: "from-red-200/70 via-transparent to-transparent dark:from-red-500/20",
    },
    emerald: {
      dot: "bg-emerald-500",
      border: "border-emerald-200/70 dark:border-emerald-900/50",
      text: "text-emerald-700 dark:text-emerald-300",
      glow: "from-emerald-200/70 via-transparent to-transparent dark:from-emerald-500/20",
    },
    violet: {
      dot: "bg-violet-500",
      border: "border-violet-200/70 dark:border-violet-900/50",
      text: "text-violet-700 dark:text-violet-300",
      glow: "from-violet-200/70 via-transparent to-transparent dark:from-violet-500/20",
    },
    slate: {
      dot: "bg-slate-500",
      border: "border-slate-200/70 dark:border-slate-900/50",
      text: "text-slate-700 dark:text-slate-300",
      glow: "from-slate-200/70 via-transparent to-transparent dark:from-slate-500/20",
    },
    blue: {
      dot: "bg-blue-500",
      border: "border-blue-200/70 dark:border-blue-900/50",
      text: "text-blue-700 dark:text-blue-300",
      glow: "from-blue-200/70 via-transparent to-transparent dark:from-blue-500/20",
    },
  };

  const content = (
    <>
      <span
        className={`pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gradient-to-br ${tones[tone].glow} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
      />
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400">
        <span className={`h-2 w-2 rounded-full ${tones[tone].dot}`} />
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${tones[tone].text}`}>{value}</div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{subtext}</p>
    </>
  );

  const baseClass = `group relative overflow-hidden rounded-xl border bg-white dark:bg-neutral-900 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${tones[tone].border}`;

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {content}
      </Link>
    );
  }

  return <div className={baseClass}>{content}</div>;
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
