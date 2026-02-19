"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { api, type ProjectWithStats } from "@/lib/client";
import { PROJECT_COLORS } from "@/lib/projects";
import { BrandMark } from "@/components/BrandMark";
import {
  IconGrid,
  IconCalendar,
  IconCheckCircle,
  IconDocument,
  IconFolder,
  IconSignOut,
  IconHelp,
  IconShield,
} from "@/components/icons";

interface SidebarProps {
  onShortcutHelp: () => void;
  onSearchOpen: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OVERVIEW_NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: IconGrid },
  { href: "/calendar", label: "Calendar", icon: IconCalendar },
];

const WORKSPACE_NAV: NavItem[] = [
  { href: "/tasks", label: "Tasks", icon: IconCheckCircle },
  { href: "/notes", label: "Notes", icon: IconDocument },
];

const MOBILE_BREAKPOINT = 768;
const COLLAPSE_BREAKPOINT = 1024;

/* ───────────────────────── Mobile Bottom Bar ───────────────────────── */

function MobileBottomBar({
  session,
  projects,
  currentProjectId,
  pathname,
  canShowAdminQuickAccess,
  isActive,
}: {
  session: ReturnType<typeof useSession>["data"];
  projects: ProjectWithStats[];
  currentProjectId: string;
  pathname: string;
  canShowAdminQuickAccess: boolean;
  isActive: (href: string) => boolean;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on route change
  useEffect(() => {
    setOpenGroup(null);
  }, [pathname]);

  // Close popover on outside tap
  useEffect(() => {
    if (!openGroup) return;
    function handleTap(e: MouseEvent | TouchEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener("mousedown", handleTap);
    document.addEventListener("touchstart", handleTap);
    return () => {
      document.removeEventListener("mousedown", handleTap);
      document.removeEventListener("touchstart", handleTap);
    };
  }, [openGroup]);

  function toggle(group: string) {
    setOpenGroup((prev) => (prev === group ? null : group));
  }

  const overviewActive = isActive("/") || isActive("/calendar");
  const workspaceActive = isActive("/tasks") || isActive("/notes");
  const projectsActive = pathname.startsWith("/projects");
  const accountActive =
    isActive("/profile") || isActive("/administration");

  const groups = [
    { key: "overview", label: "Overview", icon: IconGrid, active: overviewActive },
    { key: "workspace", label: "Work", icon: IconCheckCircle, active: workspaceActive },
    { key: "projects", label: "Projects", icon: IconFolder, active: projectsActive },
    { key: "account", label: "Account", icon: IconSignOut, active: accountActive },
  ];

  return (
    <div ref={popoverRef} className="fixed inset-x-0 bottom-0 z-[100]">
      {/* Popover panel */}
      {openGroup && (
        <div className="mx-2 mb-1 rounded-xl bg-neutral-900 border border-neutral-800/60 shadow-2xl overflow-hidden">
          <div className="max-h-[60vh] overflow-y-auto p-2 space-y-0.5">
            {openGroup === "overview" &&
              OVERVIEW_NAV.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-neutral-800/70 text-white"
                        : "text-neutral-300 hover:bg-neutral-800/40"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}

            {openGroup === "workspace" &&
              WORKSPACE_NAV.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-neutral-800/70 text-white"
                        : "text-neutral-300 hover:bg-neutral-800/40"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}

            {openGroup === "projects" && (
              <>
                <Link
                  href="/projects"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === "/projects" && !currentProjectId
                      ? "bg-neutral-800/70 text-white"
                      : "text-neutral-300 hover:bg-neutral-800/40"
                  }`}
                >
                  <IconFolder className="w-5 h-5 flex-shrink-0" />
                  All Projects
                </Link>
                {projects.map((project) => {
                  const active = project.id === currentProjectId;
                  const color = PROJECT_COLORS[project.color]?.dot ?? "bg-blue-500";
                  return (
                    <Link
                      key={project.id}
                      href={`/projects?projectId=${project.id}`}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-neutral-800/70 text-white"
                          : "text-neutral-300 hover:bg-neutral-800/40"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${color}`} />
                      <span className="flex-1 truncate">{project.name}</span>
                      <span className="text-xs text-neutral-500">{project.stats.total}</span>
                    </Link>
                  );
                })}
                {projects.length === 0 && (
                  <p className="px-3 py-2 text-xs text-neutral-500">No active projects</p>
                )}
              </>
            )}

            {openGroup === "account" && (
              <>
                {/* Profile */}
                <Link
                  href="/profile"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive("/profile")
                      ? "bg-neutral-800/70 text-white"
                      : "text-neutral-300 hover:bg-neutral-800/40"
                  }`}
                >
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-neutral-700 flex-shrink-0 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" />
                      </svg>
                    </div>
                  )}
                  Profile
                </Link>

                {/* Admin */}
                {canShowAdminQuickAccess && (
                  <Link
                    href="/administration"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive("/administration")
                        ? "bg-neutral-800/70 text-white"
                        : "text-red-400 hover:bg-neutral-800/40"
                    }`}
                  >
                    <IconShield className="w-5 h-5 flex-shrink-0" />
                    Administration
                  </Link>
                )}

                {/* Sign out */}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-400 hover:bg-neutral-800/40 hover:text-white transition-colors"
                >
                  <IconSignOut className="w-5 h-5 flex-shrink-0" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <div className="flex items-center justify-around bg-neutral-950 border-t border-neutral-800/50 px-1 pb-[env(safe-area-inset-bottom)]">
        {groups.map(({ key, label, icon: Icon, active }) => {
          const isOpen = openGroup === key;
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`flex flex-col items-center gap-0.5 py-2.5 px-3 min-w-0 flex-1 rounded-lg transition-colors ${
                isOpen
                  ? "text-white"
                  : active
                    ? "text-blue-400"
                    : "text-neutral-500"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Main Sidebar Export ───────────────────────── */

export function Sidebar({ onShortcutHelp, onSearchOpen }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.3.0";

  const defaultSectionsOpen = useMemo(
    () => ({
      main: true,
      workspace: true,
      projects: true,
      account: true,
    }),
    [],
  );

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>(
    defaultSectionsOpen,
  );
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);

  // Auto-collapse / mobile based on screen width
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      setIsMobile(w < MOBILE_BREAKPOINT);
      setCollapsed(w >= MOBILE_BREAKPOINT && w < COLLAPSE_BREAKPOINT);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await api.projects.listWithStats({ status: "active" });
      setProjects(Array.isArray(data) ? data : data.data);
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    function handleRefresh() {
      fetchProjects();
    }
    window.addEventListener("projects:refresh", handleRefresh);
    return () => window.removeEventListener("projects:refresh", handleRefresh);
  }, [fetchProjects]);

  // Read section open state from localStorage on mount
  useEffect(() => {
    const sectionState = localStorage.getItem("sidebar-sections-open");
    if (!sectionState) return;

    try {
      const parsed = JSON.parse(sectionState) as Record<string, boolean>;
      setSectionsOpen((prev) => ({
        ...prev,
        ...defaultSectionsOpen,
        ...parsed,
      }));
    } catch {
      setSectionsOpen(defaultSectionsOpen);
    }
  }, [defaultSectionsOpen]);

  useEffect(() => {
    localStorage.setItem("sidebar-sections-open", JSON.stringify(sectionsOpen));
  }, [sectionsOpen]);

  function toggleSection(key: string) {
    if (collapsed) return;
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const profileActive = isActive("/profile");
  const canShowAdminQuickAccess = session?.user?.role === "admin" && (session?.user?.showAdminQuickAccess ?? true);

  const currentProjectId = useMemo(() => {
    if (pathname.startsWith("/projects") || pathname.startsWith("/tasks")) {
      return searchParams.get("projectId") || "";
    }
    return "";
  }, [pathname, searchParams]);

  const projectsRootActive = pathname.startsWith("/projects") && !currentProjectId;
  const workspaceNavItems = useMemo(() => {
    const items = [...WORKSPACE_NAV];
    return items;
  }, [session?.user?.assistantEnabled]);

  /* ── Mobile: bottom bar ── */
  if (isMobile) {
    return (
      <MobileBottomBar
        session={session}
        projects={projects}
        currentProjectId={currentProjectId}
        pathname={pathname}
        canShowAdminQuickAccess={canShowAdminQuickAccess}
        isActive={isActive}
      />
    );
  }

  /* ── Desktop / Tablet: traditional sidebar ── */
  return (
    <aside
      className={`flex flex-col bg-neutral-950 text-neutral-400 transition-all duration-300 ease-in-out h-screen flex-shrink-0 border-r border-neutral-800/50 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand */}
      <div className={`flex flex-shrink-0 border-b border-neutral-800/50 ${
        collapsed ? "flex-col items-center gap-2 py-4" : "items-center justify-between h-16 px-4"
      }`}>
        <Link
          href="/"
          className={`flex items-center hover:opacity-80 transition-opacity ${
            collapsed ? "" : "gap-3 min-w-0"
          }`}
          title={collapsed ? `Dispatch` : "Dashboard"}
        >
          <BrandMark compact className="flex-shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-lg font-bold text-white whitespace-nowrap">
                Dispatch
              </span>
              <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                Task Management
              </p>
            </div>
          )}
        </Link>
        <button
          onClick={onShortcutHelp}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-neutral-500 hover:bg-neutral-800/40 hover:text-neutral-300 transition-colors flex-shrink-0"
          title="Keyboard shortcuts"
        >
          <IconHelp className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className={`sidebar-scrollbar flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-4 ${
        collapsed ? "px-2" : "px-3"
      }`}>
        {/* Overview section */}
        <div>
          {!collapsed && (
            <button
              onClick={() => toggleSection("main")}
              className="flex items-center w-full mb-1 px-2"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 whitespace-nowrap">
                Overview
              </span>
            </button>
          )}

          {(sectionsOpen.main || collapsed) && (
            <div className="space-y-3">
              <ul className="space-y-0.5">
                {OVERVIEW_NAV.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={`group/nav flex items-center rounded-lg py-2 text-sm font-medium transition-all active:scale-[0.97] ${
                          active
                            ? "bg-neutral-800/60 text-white"
                            : "text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200"
                        } ${collapsed ? "justify-center" : "gap-3 px-3"}`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span
                          className={`whitespace-nowrap transition-all duration-300 ${
                            collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                          }`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Workspace section */}
        <div className="pt-3 border-t border-neutral-800/50">
          {!collapsed && (
            <button
              onClick={() => toggleSection("workspace")}
              className="flex items-center w-full mb-1 px-2"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 whitespace-nowrap">
                Workspace
              </span>
            </button>
          )}

          {(sectionsOpen.workspace || collapsed) && (
            <ul className="space-y-0.5">
              {workspaceNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`group/nav flex items-center rounded-lg py-2 text-sm font-medium transition-all active:scale-[0.97] ${
                        active
                          ? "bg-neutral-800/60 text-white"
                          : "text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200"
                      } ${collapsed ? "justify-center" : "gap-3 px-3"}`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span
                        className={`whitespace-nowrap transition-all duration-300 ${
                          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Projects section */}
        <div className="pt-3 border-t border-neutral-800/50">
          {!collapsed && (
            <button
              onClick={() => toggleSection("projects")}
              className="flex items-center w-full mb-1 px-2"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 whitespace-nowrap">
                Projects
              </span>
            </button>
          )}

          {(sectionsOpen.projects || collapsed) && (
            <ul className="space-y-0.5">
              {projects.length === 0 ? (
                <li className={`px-3 py-2 text-xs text-neutral-600 ${collapsed ? "hidden" : ""}`}>
                  <Link
                        href={`/projects`}
                        title={collapsed ? "Projects" : undefined}
                        className={`group/nav flex items-center rounded-lg py-2 text-sm font-medium transition-all active:scale-[0.97] ${"text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200"} ${collapsed ? "justify-center" : "gap-3 px-3"}`}
                      > No active projects</Link>
                </li>
              ) : (
                projects.map((project) => {
                  const active = project.id === currentProjectId;
                  const color = PROJECT_COLORS[project.color]?.dot ?? "bg-blue-500";
                  return (
                    <li key={project.id}>
                      <Link
                        href={`/projects?projectId=${project.id}`}
                        title={collapsed ? project.name : undefined}
                        className={`group/nav flex items-center rounded-lg py-2 text-sm font-medium transition-all active:scale-[0.97] ${
                          active
                            ? "bg-neutral-800/60 text-white"
                            : "text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200"
                        } ${collapsed ? "justify-center" : "gap-3 px-3"}`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${color}`} />
                        {!collapsed && (
                          <>
                            <span className="whitespace-nowrap flex-1">
                              {project.name}
                            </span>
                            <span className="text-xs text-neutral-500 group-hover/nav:text-neutral-300">
                              {project.stats.total}
                            </span>
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>

      </nav>

      {/* Account section */}
      {session?.user && (
        <div className={`border-t border-neutral-800/50 py-3 flex-shrink-0 ${
          collapsed ? "px-2" : "px-3"
        }`}>
          {!collapsed && (
            <button
              onClick={() => toggleSection("account")}
              className="flex items-center w-full mb-2 px-2"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 whitespace-nowrap">
                Account
              </span>
            </button>
          )}

          {(sectionsOpen.account || collapsed) && (
            <ul className="space-y-0.5">
              {/* Profile */}
              <li>
                <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
                  <Link
                    href="/profile"
                    title={collapsed ? "Profile" : undefined}
                    className={`flex items-center rounded-lg py-2 transition-all ${
                      profileActive
                        ? "bg-neutral-800/60 text-white"
                        : "text-neutral-300 hover:bg-neutral-800/40 hover:text-neutral-200"
                    } ${collapsed ? "justify-center" : "flex-1 gap-3 px-3"}`}
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        className="w-5 h-5 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-neutral-700 flex-shrink-0 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" />
                        </svg>
                      </div>
                    )}
                    <span
                      className={`text-sm truncate whitespace-nowrap transition-all duration-300 ${
                        collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                      }`}
                    >
                      {session.user.name || session.user.email}
                    </span>
                  </Link>
                  {!collapsed && (
                    <div className="flex items-center gap-1.5">
                      {canShowAdminQuickAccess && (
                        <Link
                          href="/administration"
                          title="Administration"
                          aria-label="Administration"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-red-700/60 bg-red-950/20 text-red-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:bg-red-900/40 hover:text-red-200 transition-all active:scale-[0.97]"
                        >
                          <IconShield className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        title="Sign out"
                        aria-label="Sign out"
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-700/70 bg-neutral-900/50 text-neutral-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:bg-neutral-800/80 hover:text-white transition-all active:scale-[0.97]"
                      >
                        <IconSignOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            </ul>
          )}
        </div>
      )}

    </aside>
  );
}
