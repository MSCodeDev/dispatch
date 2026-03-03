/**
 * Obsidian → Dispatch Migration Script
 *
 * Imports tasks, projects, and reference notes from an Obsidian vault
 * (msnotes/) into the Dispatch SQLite database.
 *
 * Usage:
 *   npx tsx scripts/migrate-obsidian.ts [--user-email <email>]
 *
 * Defaults to the first user in the database if --user-email is not provided.
 */

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { tasks, notes, projects, users } from "../src/db/schema";
import { eq, and } from "drizzle-orm";
import matter from "gray-matter";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const MSNOTES_DIR = path.resolve(__dirname, "../msnotes");
const TASK_DESC_LIMIT = 5_000;
const NOTE_CONTENT_LIMIT = 100_000;
const TITLE_LIMIT = 500;

const SKIP_REFERENCES = new Set(["Info.md"]);

const PROJECT_COLORS: Array<"blue" | "emerald" | "amber" | "rose" | "violet" | "slate"> = [
  "blue",
  "emerald",
  "amber",
  "rose",
  "violet",
  "slate",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string | undefined | null, limit: number): string | null {
  if (!text) return null;
  return text.length > limit ? text.slice(0, limit) : text;
}

function toISOUTC(dateVal: string | Date | undefined | null): string | undefined {
  if (!dateVal) return undefined;
  try {
    const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString();
  } catch (_) {
    return undefined;
  }
}

/** Format a value (Date object or string) as YYYY-MM-DD */
function toDateStr(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    return val.toISOString().split("T")[0];
  }
  const s = String(val).trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Try parsing as date
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  } catch (_) {
    return null;
  }
}

function stripWikiLink(link: string): string {
  return link.replace(/^\[\[/, "").replace(/\]\]$/, "").trim();
}

function titleFromFilename(filename: string): string {
  return filename.replace(/\.md$/, "");
}

function readMarkdownFile(filePath: string): { data: Record<string, unknown>; content: string } {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = matter(raw);
  return { data: parsed.data as Record<string, unknown>, content: parsed.content.trim() };
}

function parseArgs(): { userEmail?: string } {
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf("--user-email");
  if (emailIdx !== -1 && args[emailIdx + 1]) {
    return { userEmail: args[emailIdx + 1] };
  }
  return {};
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function migrate() {
  const { userEmail } = parseArgs();

  // Open database
  const sqlite = new Database("./dispatch.db");
  const db = drizzle(sqlite);

  // Resolve target user
  let user;
  if (userEmail) {
    [user] = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    if (!user) {
      console.error(`❌ No user found with email: ${userEmail}`);
      sqlite.close();
      process.exit(1);
    }
  } else {
    [user] = await db.select().from(users).limit(1);
    if (!user) {
      console.error("❌ No users found in database. Create an account first.");
      sqlite.close();
      process.exit(1);
    }
  }

  const userId = user.id;
  console.log(`\nMigrating Obsidian notes for user: ${user.email ?? user.name ?? userId}`);
  console.log(`Source: ${MSNOTES_DIR}\n`);

  const stats = {
    projectsCreated: 0,
    projectsSkipped: 0,
    tasksCreated: 0,
    tasksSkipped: 0,
    notesCreated: 0,
    notesSkipped: 0,
  };

  // ---------- Phase 1: Collect & create projects ----------

  console.log("── Phase 1: Projects ──");

  // Gather project names from Projects/ directory
  const projectNames = new Set<string>();
  const projectDescriptions = new Map<string, string>();

  const projectsDir = path.join(MSNOTES_DIR, "Projects");
  if (fs.existsSync(projectsDir)) {
    const projectFiles = fs.readdirSync(projectsDir).filter((f) => f.endsWith(".md"));
    for (const file of projectFiles) {
      const name = titleFromFilename(file);
      projectNames.add(name);
      const { content } = readMarkdownFile(path.join(projectsDir, file));
      if (content) {
        projectDescriptions.set(name, content);
      }
    }
  }

  // Gather project names from task frontmatter
  const tasksDir = path.join(MSNOTES_DIR, "Tasks");
  const taskFiles = fs.existsSync(tasksDir)
    ? fs.readdirSync(tasksDir).filter((f) => f.endsWith(".md"))
    : [];

  for (const file of taskFiles) {
    const { data } = readMarkdownFile(path.join(tasksDir, file));
    const projRefs = data.projects;
    if (Array.isArray(projRefs)) {
      for (const ref of projRefs) {
        if (typeof ref === "string" && ref.includes("[[")) {
          projectNames.add(stripWikiLink(ref));
        }
      }
    }
  }

  // Create projects and build lookup map
  const projectIdMap = new Map<string, string>();
  let colorIdx = 0;

  for (const name of projectNames) {
    // Check for existing project with same name for this user
    const [existing] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.name, name)))
      .limit(1);

    if (existing) {
      projectIdMap.set(name, existing.id);
      stats.projectsSkipped++;
      console.log(`  ⏭  Project already exists: "${name}"`);
      continue;
    }

    const now = new Date().toISOString();
    const desc = projectDescriptions.get(name);
    const [created] = await db
      .insert(projects)
      .values({
        userId,
        name: truncate(name, 200)!,
        description: truncate(desc, TASK_DESC_LIMIT),
        status: "active",
        color: PROJECT_COLORS[colorIdx % PROJECT_COLORS.length],
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    projectIdMap.set(name, created.id);
    colorIdx++;
    stats.projectsCreated++;
    console.log(`  ✅ Created project: "${name}"`);
  }

  // ---------- Phase 2: Import tasks ----------

  console.log("\n── Phase 2: Tasks ──");

  for (const file of taskFiles) {
    const title = titleFromFilename(file);

    // Check for duplicate
    const [existing] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.title, title)))
      .limit(1);

    if (existing) {
      stats.tasksSkipped++;
      continue;
    }

    const filePath = path.join(tasksDir, file);
    const { data, content } = readMarkdownFile(filePath);

    // Map status
    const rawStatus = String(data.status || "open").toLowerCase();
    const status: "open" | "in_progress" | "done" =
      rawStatus === "done" ? "done" : rawStatus === "in_progress" ? "in_progress" : "open";

    // Due date: prefer 'due' over 'scheduled'
    const dueDate = toDateStr(data.due) ?? toDateStr(data.scheduled);

    // Project reference
    let projectId: string | null = null;
    if (Array.isArray(data.projects)) {
      for (const ref of data.projects) {
        if (typeof ref === "string" && ref.includes("[[")) {
          const projName = stripWikiLink(ref);
          if (projectIdMap.has(projName)) {
            projectId = projectIdMap.get(projName)!;
            break;
          }
        }
      }
    }

    // Timestamps
    const createdAt = toISOUTC(data.dateCreated as string | Date) ?? new Date().toISOString();
    const updatedAt = toISOUTC(data.dateModified as string | Date) ?? createdAt;

    await db.insert(tasks).values({
      userId,
      projectId,
      title: truncate(title, TITLE_LIMIT)!,
      description: truncate(content || null, TASK_DESC_LIMIT),
      status,
      priority: "medium",
      dueDate,
      createdAt,
      updatedAt,
    });

    stats.tasksCreated++;
  }

  console.log(`  ✅ Created ${stats.tasksCreated} tasks`);
  if (stats.tasksSkipped > 0) {
    console.log(`  ⏭  Skipped ${stats.tasksSkipped} duplicate tasks`);
  }

  // ---------- Phase 3: Import reference notes ----------

  console.log("\n── Phase 3: Reference Notes ──");

  const refsDir = path.join(MSNOTES_DIR, "References");
  if (fs.existsSync(refsDir)) {
    const refFiles = fs.readdirSync(refsDir).filter((f) => f.endsWith(".md"));

    for (const file of refFiles) {
      if (SKIP_REFERENCES.has(file)) {
        console.log(`  ⏭  Skipping sensitive file: ${file}`);
        continue;
      }

      const title = titleFromFilename(file);

      // Check for duplicate
      const [existing] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.userId, userId), eq(notes.title, title)))
        .limit(1);

      if (existing) {
        stats.notesSkipped++;
        continue;
      }

      const { content } = readMarkdownFile(path.join(refsDir, file));
      const now = new Date().toISOString();

      await db.insert(notes).values({
        userId,
        title: truncate(title, TITLE_LIMIT)!,
        content: truncate(content || null, NOTE_CONTENT_LIMIT),
        createdAt: now,
        updatedAt: now,
      });

      stats.notesCreated++;
    }
  }

  console.log(`  ✅ Created ${stats.notesCreated} notes`);
  if (stats.notesSkipped > 0) {
    console.log(`  ⏭  Skipped ${stats.notesSkipped} duplicate notes`);
  }

  // ---------- Summary ----------

  console.log("\n── Migration Complete ──");
  console.log(`  Projects: ${stats.projectsCreated} created, ${stats.projectsSkipped} skipped`);
  console.log(`  Tasks:    ${stats.tasksCreated} created, ${stats.tasksSkipped} skipped`);
  console.log(`  Notes:    ${stats.notesCreated} created, ${stats.notesSkipped} skipped`);
  console.log();

  sqlite.close();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
