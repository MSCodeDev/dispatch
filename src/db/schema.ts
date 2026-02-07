import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// --- NextAuth tables (must match @auth/drizzle-adapter expectations) ---

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

// --- Domain tables ---

export const tasks = sqliteTable(
  "task",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", { enum: ["open", "in_progress", "done"] })
      .notNull()
      .default("open"),
    priority: text("priority", { enum: ["low", "medium", "high"] })
      .notNull()
      .default("medium"),
    dueDate: text("dueDate"),
    createdAt: text("createdAt")
      .notNull()
      .default(sql`(current_timestamp)`),
    updatedAt: text("updatedAt")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    index("task_userId_idx").on(table.userId),
    index("task_status_idx").on(table.status),
    index("task_priority_idx").on(table.priority),
  ]
);

export const notes = sqliteTable(
  "note",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content"),
    createdAt: text("createdAt")
      .notNull()
      .default(sql`(current_timestamp)`),
    updatedAt: text("updatedAt")
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [index("note_userId_idx").on(table.userId)]
);
