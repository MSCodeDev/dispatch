import { withAuth, jsonResponse, errorResponse } from "@/lib/api";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/** DELETE /api/api-keys/[id] — delete an API key */
export const DELETE = withAuth(async (req, session, { params }) => {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return errorResponse("id is required", 400);
  }

  const [existing] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, session.user!.id!)))
    .limit(1);

  if (!existing) {
    return errorResponse("API key not found", 404);
  }

  await db.delete(apiKeys).where(eq(apiKeys.id, id));

  return jsonResponse({ success: true });
});
