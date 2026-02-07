import { withAuth, jsonResponse, errorResponse } from "@/lib/api";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";

/** GET /api/notes — list notes for the current user */
export const GET = withAuth(async (req, session) => {
  const url = new URL(req.url);
  const search = url.searchParams.get("search");

  let query = db
    .select()
    .from(notes)
    .where(eq(notes.userId, session.user!.id!))
    .orderBy(notes.createdAt)
    .$dynamic();

  // Title search handled in-app since SQLite LIKE is simple enough
  const results = await query;

  if (search) {
    const lower = search.toLowerCase();
    return jsonResponse(results.filter((n) => n.title.toLowerCase().includes(lower)));
  }

  return jsonResponse(results);
});

/** POST /api/notes — create a new note */
export const POST = withAuth(async (req, session) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { title, content } = body as Record<string, unknown>;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return errorResponse("title is required and must be a non-empty string", 400);
  }

  if (content !== undefined && typeof content !== "string") {
    return errorResponse("content must be a string", 400);
  }

  const now = new Date().toISOString();

  const [note] = await db
    .insert(notes)
    .values({
      userId: session.user!.id!,
      title: (title as string).trim(),
      content: content as string | undefined,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return jsonResponse(note, 201);
});
