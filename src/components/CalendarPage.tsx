"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  api,
  type Task,
  type Project,
} from "@/lib/client";
import { TaskModal } from "@/components/TaskModal";
import { useToast } from "@/components/ToastProvider";
import { PROJECT_COLORS } from "@/lib/projects";
import { IconChevronLeft, IconPlus } from "@/components/icons";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const COLS = 5;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function statusDotColor(status: string) {
  switch (status) {
    case "open":
      return "bg-blue-500";
    case "in_progress":
      return "bg-yellow-500";
    case "done":
      return "bg-green-500";
    default:
      return "bg-neutral-400";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "open":
      return "Open";
    case "in_progress":
      return "In Progress";
    case "done":
      return "Done";
    default:
      return status;
  }
}

export function CalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultDueDate, setDefaultDueDate] = useState<string | undefined>(undefined);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const suppressRefreshRef = useRef(false);

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.tasks.list();
      setTasks(Array.isArray(data) ? data : data.data);
    } finally {
      if (!silent) setLoading(false);
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
    return () => { active = false; };
  }, []);

  // Listen for tasks:changed to refresh (skip if drag/drop just updated optimistically)
  useEffect(() => {
    function handleTasksChanged() {
      if (suppressRefreshRef.current) {
        suppressRefreshRef.current = false;
        return;
      }
      fetchTasks(true);
    }
    window.addEventListener("tasks:changed", handleTasksChanged);
    return () => window.removeEventListener("tasks:changed", handleTasksChanged);
  }, [fetchTasks]);

  // Listen for keyboard shortcut to create new task
  useEffect(() => {
    function handleNewTask() {
      setEditingTask(null);
      setDefaultDueDate(todayStr());
      setModalOpen(true);
    }
    window.addEventListener("shortcut:new-task", handleNewTask);
    return () => window.removeEventListener("shortcut:new-task", handleNewTask);
  }, []);

  // Open modal when arriving with ?new=1
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setEditingTask(null);
    setDefaultDueDate(todayStr());
    setModalOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("new");
    const qs = params.toString();
    router.replace(`/calendar${qs ? "?" + qs : ""}`, { scroll: false });
  }, [searchParams, router]);

  // Group tasks by dueDate, sorted by priority then alphabetically
  const tasksByDate = useMemo(() => {
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const existing = map.get(task.dueDate);
      if (existing) {
        existing.push(task);
      } else {
        map.set(task.dueDate, [task]);
      }
    }
    for (const [, list] of map) {
      list.sort((a, b) => {
        const pa = priorityOrder[a.priority] ?? 3;
        const pb = priorityOrder[b.priority] ?? 3;
        if (pa !== pb) return pa - pb;
        return a.title.localeCompare(b.title);
      });
    }
    return map;
  }, [tasks]);

  // Project lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    for (const p of projects) map.set(p.id, p);
    return map;
  }, [projects]);

  // Calendar grid generation (weekdays only: Mon–Fri, current month only)
  const calendarDays = useMemo(() => {
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();

    // Find the first weekday of the month
    let firstWeekday = 1;
    while (firstWeekday <= daysInMonth) {
      const dow = new Date(year, month - 1, firstWeekday).getDay();
      if (dow !== 0 && dow !== 6) break;
      firstWeekday++;
    }
    // Mon-based column index: Mon=0 … Fri=4
    const firstWeekdayCol = (new Date(year, month - 1, firstWeekday).getDay() + 6) % 7;
    const leadingBlanks = Math.min(firstWeekdayCol, 4);

    type CalendarDay = { day: number; month: number; year: number; isCurrentMonth: boolean; dateStr: string } | null;
    const days: CalendarDay[] = [];

    // Leading blank cells so the first weekday lands in the correct column
    for (let i = 0; i < leadingBlanks; i++) {
      days.push(null);
    }

    // Current month weekdays only (skip Sat=6, Sun=0)
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month - 1, d).getDay();
      if (dow === 0 || dow === 6) continue;
      days.push({ day: d, month, year, isCurrentMonth: true, dateStr: formatDateStr(year, month, d) });
    }

    // Trailing blank cells to fill the last row
    const trailing = (COLS - (days.length % COLS)) % COLS;
    for (let i = 0; i < trailing; i++) {
      days.push(null);
    }

    return days;
  }, [year, month]);

  const todayRef = useRef<HTMLDivElement>(null);

  const monthName = new Date(year, month - 1).toLocaleDateString("en-US", { month: "long" });
  const today = todayStr();

  // Scroll to today's cell after loading completes
  useEffect(() => {
    if (!loading && todayRef.current) {
      todayRef.current.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [loading]);

  function navigateMonth(offset: number) {
    let newMonth = month + offset;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  function goToToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  }

  function handleTaskClick(e: React.MouseEvent, task: Task) {
    e.stopPropagation();
    setEditingTask(task);
    setDefaultDueDate(undefined);
    setModalOpen(true);
  }

  function handleCellClick(dateStr: string) {
    if (draggingTaskId) return; // don't open modal during drag
    setEditingTask(null);
    setDefaultDueDate(dateStr);
    setModalOpen(true);
  }

  // Drag and drop handlers
  function handleDragStart(e: React.DragEvent, task: Task) {
    e.stopPropagation();
    setDraggingTaskId(task.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.id);
  }

  function handleDragEnd() {
    setDraggingTaskId(null);
    setDropTarget(null);
  }

  function handleDragOver(e: React.DragEvent, dateStr: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropTarget !== dateStr) setDropTarget(dateStr);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the cell (not entering a child)
    const related = e.relatedTarget as HTMLElement | null;
    if (!e.currentTarget.contains(related)) {
      setDropTarget(null);
    }
  }

  async function handleDrop(e: React.DragEvent, dateStr: string) {
    e.preventDefault();
    setDropTarget(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.dueDate === dateStr) {
      setDraggingTaskId(null);
      return;
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, dueDate: dateStr } : t)),
    );
    setDraggingTaskId(null);

    try {
      suppressRefreshRef.current = true;
      await api.tasks.update(taskId, { dueDate: dateStr });
      toast.success("Task moved");
    } catch {
      // Revert on failure
      fetchTasks();
      toast.error("Failed to move task");
    }
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingTask(null);
    setDefaultDueDate(undefined);
  }

  function handleModalSaved() {
    setModalOpen(false);
    setEditingTask(null);
    setDefaultDueDate(undefined);
    toast.success("Task saved");
  }

  // Count tasks without due dates
  const tasksWithoutDueDate = useMemo(() => tasks.filter((t) => !t.dueDate).length, [tasks]);
  const totalTasksThisMonth = useMemo(() => {
    return calendarDays
      .filter((d): d is NonNullable<typeof d> => d !== null && d.isCurrentMonth)
      .reduce((sum, d) => sum + (tasksByDate.get(d.dateStr)?.length ?? 0), 0);
  }, [calendarDays, tasksByDate]);

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header with month navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Calendar</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {totalTasksThisMonth} task{totalTasksThisMonth !== 1 ? "s" : ""} this month
            {tasksWithoutDueDate > 0 && (
              <span> · {tasksWithoutDueDate} without due date</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateMonth(-1)}
            className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all"
            aria-label="Previous month"
          >
            <IconChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white min-w-[180px] text-center">
            {monthName} {year}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition-all"
            aria-label="Next month"
          >
            <IconChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400 rotate-180" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-5 border-b border-neutral-200 dark:border-neutral-800">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className="px-3 py-3 text-center text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span className="inline-block w-6 h-6 border-2 border-neutral-300 dark:border-neutral-600 border-t-transparent rounded-full animate-spinner" />
          </div>
        ) : (
          <div className="grid grid-cols-5">
            {calendarDays.map((cell, idx) => {
              if (cell === null) {
                return (
                  <div
                    key={`blank-${idx}`}
                    className="min-h-[160px] border-b border-r border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/30"
                  />
                );
              }

              const dayTasks = tasksByDate.get(cell.dateStr) ?? [];
              const isToday = cell.dateStr === today;
              const isDropTarget = dropTarget === cell.dateStr;

              return (
                <div
                  key={idx}
                  ref={isToday ? todayRef : undefined}
                  onClick={() => handleCellClick(cell.dateStr)}
                  onDragOver={(e) => handleDragOver(e, cell.dateStr)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, cell.dateStr)}
                  className={`
                    group relative min-h-[160px] border-b border-r border-neutral-100 dark:border-neutral-800 p-2 cursor-pointer
                    transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50
                    ${idx % 5 === 0 ? "border-l-0" : ""}
                    ${isToday ? "border-blue-200 dark:border-blue-800/60" : ""}
                    ${isDropTarget ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-inset ring-blue-400 dark:ring-blue-500" : ""}
                  `}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`
                        inline-flex items-center justify-center text-xs font-medium w-6 h-6
                        ${isToday ? "font-bold text-blue-600 dark:text-blue-400" : ""}
                        ${!isToday && cell.isCurrentMonth ? "text-neutral-500 dark:text-neutral-400" : ""}
                        ${!isToday && !cell.isCurrentMonth ? "text-neutral-400 dark:text-neutral-600" : ""}
                      `}
                    >
                      {cell.day}
                    </span>
                    {/* Add button on hover */}
                    <span
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400 hover:text-blue-500 dark:text-neutral-600 dark:hover:text-blue-400"
                      title="Add task"
                    >
                      <IconPlus className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Tasks list */}
                  <div className="space-y-1">
                    {dayTasks.map((task) => {
                      const project = task.projectId ? projectMap.get(task.projectId) : null;
                      const projectColor = project?.color ? PROJECT_COLORS[project.color as keyof typeof PROJECT_COLORS] : null;
                      const isDone = task.status === "done";

                      return (
                        <button
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => handleTaskClick(e, task)}
                          title={`${task.title} — ${statusLabel(task.status)}`}
                          className={`
                            w-full text-left rounded-md px-2 py-1 text-sm leading-snug truncate flex items-center gap-1.5
                            transition-colors cursor-grab active:cursor-grabbing
                            ${draggingTaskId === task.id ? "opacity-40" : ""}
                            ${isDone
                              ? "opacity-50 line-through text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800/60 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/60"
                              : "text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800/60 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/60"
                            }
                          `}
                        >
                          <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${statusDotColor(task.status)}`} />
                          <span className="truncate">{task.title}</span>
                          {projectColor && (
                            <span
                              className="inline-block w-2 h-2 rounded-full shrink-0 ml-auto"
                              style={{ backgroundColor: projectColor.dot }}
                              title={project?.name}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          defaultDueDate={defaultDueDate}
          onClose={handleModalClose}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}
