import { vi } from "vitest";

// Mock next-auth's auth() — individual tests override via mockSession()
let currentSession: { user: { id: string; name: string; email: string } } | null = null;

vi.mock("@/auth", () => ({
  auth: vi.fn(() => Promise.resolve(currentSession)),
}));

/**
 * Set the mock session for subsequent API calls.
 * Pass `null` to simulate an unauthenticated request.
 */
export function mockSession(
  session: { user: { id: string; name: string; email: string } } | null
) {
  currentSession = session;
}

// Mock NextResponse since it's only available in a Next.js runtime
vi.mock("next/server", () => {
  class MockNextResponse extends Response {
    static json(data: unknown, init?: ResponseInit) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: { "content-type": "application/json", ...init?.headers },
      });
    }
  }
  return { NextResponse: MockNextResponse };
});
