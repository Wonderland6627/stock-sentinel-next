/**
 * Property test for P6: Profile 页面未登录重定向
 *
 * Validates: Requirements 4.8, 4.9
 *
 * Property 6: For any request where pathname.startsWith("/profile") and user = null,
 * the middleware must return response.status = 302 and response.headers.location = "/login".
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Minimal stubs for next/server types used by the middleware
// ---------------------------------------------------------------------------

// We build a lightweight NextRequest-like object so we don't need the full
// Next.js runtime.  The middleware only reads:
//   request.cookies.getAll()
//   request.nextUrl.pathname
//   request.nextUrl.clone()  → returns a URL-like object with a writable pathname
// and calls NextResponse.next() / NextResponse.redirect().

function makeRequest(pathname: string) {
  const url = new URL(`http://localhost${pathname}`);
  return {
    cookies: {
      getAll: () => [] as { name: string; value: string }[],
      set: vi.fn(),
    },
    nextUrl: {
      pathname,
      clone() {
        const cloned = new URL(url.toString());
        return {
          get pathname() {
            return cloned.pathname;
          },
          set pathname(v: string) {
            cloned.pathname = v;
          },
          toString() {
            return cloned.toString();
          },
        };
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Mock next/server
// ---------------------------------------------------------------------------

vi.mock("next/server", () => {
  return {
    NextResponse: {
      next: ({ request }: { request: unknown }) => ({
        _type: "next",
        status: 200,
        cookies: {
          set: vi.fn(),
          getAll: () => [],
        },
        headers: new Headers(),
        request,
      }),
      redirect: (url: { toString(): string; pathname?: string }) => {
        const location =
          typeof url === "object" && "pathname" in url
            ? (url as { pathname: string }).pathname
            : url.toString();
        return {
          _type: "redirect",
          status: 302,
          headers: new Headers({ location }),
        };
      },
    },
  };
});

// ---------------------------------------------------------------------------
// Mock @supabase/ssr — always returns user = null (unauthenticated)
// ---------------------------------------------------------------------------

vi.mock("@supabase/ssr", () => {
  return {
    createServerClient: () => ({
      auth: {
        getUser: async () => ({ data: { user: null } }),
      },
    }),
  };
});

// ---------------------------------------------------------------------------
// Import the middleware AFTER mocks are registered
// ---------------------------------------------------------------------------

import { updateSession } from "../middleware";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates a pathname that starts with "/profile".
 * Examples: "/profile", "/profile/", "/profile/settings", "/profile/edit/avatar"
 */
const profilePathnameArb = fc
  .array(
    fc.stringMatching(/^[a-z0-9_-]{1,12}$/),
    { minLength: 0, maxLength: 4 }
  )
  .map((segments) =>
    segments.length === 0 ? "/profile" : `/profile/${segments.join("/")}`
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("P6 — Profile 页面未登录重定向 (Property-Based)", () => {
  beforeEach(() => {
    // Provide dummy env vars so the middleware doesn't throw on startup
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it(
    /**
     * **Validates: Requirements 4.8, 4.9**
     *
     * For any pathname that starts with "/profile" and an unauthenticated user
     * (user = null), the middleware must redirect to /login with HTTP 302.
     */
    "for any /profile pathname with user=null, response.status=302 and location=/login",
    async () => {
      await fc.assert(
        fc.asyncProperty(profilePathnameArb, async (pathname) => {
          const request = makeRequest(pathname);
          // Cast to unknown then to the expected type to satisfy TypeScript
          const response = await updateSession(request as unknown as import("next/server").NextRequest);

          expect(response.status).toBe(302);
          expect(response.headers.get("location")).toBe("/login");
        }),
        { numRuns: 100, verbose: true }
      );
    }
  );

  it("redirects /profile exactly (no trailing path) to /login with 302", async () => {
    const request = makeRequest("/profile");
    const response = await updateSession(request as unknown as import("next/server").NextRequest);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/login");
  });

  it("redirects /profile/settings to /login with 302", async () => {
    const request = makeRequest("/profile/settings");
    const response = await updateSession(request as unknown as import("next/server").NextRequest);

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/login");
  });
});
