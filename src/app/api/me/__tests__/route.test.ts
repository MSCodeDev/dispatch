import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "@/test/db";
import { mockSession } from "@/test/setup";
import { users } from "@/db/schema";

let testDb: ReturnType<typeof createTestDb>;

vi.mock("@/db", () => ({
  get db() {
    return testDb.db;
  },
}));

const { GET } = await import("@/app/api/me/route");

const TEST_USER = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  role: "admin" as const,
};

describe("Me API", () => {
  beforeEach(() => {
    testDb = createTestDb();
    testDb.db.insert(users).values(TEST_USER).run();
    mockSession({
      user: {
        id: TEST_USER.id,
        name: TEST_USER.name,
        email: TEST_USER.email,
        role: TEST_USER.role,
      },
    });
  });

  it("GET returns current user session", async () => {
    const res = await GET(new Request("http://localhost/api/me"), {});
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.id).toBe(TEST_USER.id);
  });
});
