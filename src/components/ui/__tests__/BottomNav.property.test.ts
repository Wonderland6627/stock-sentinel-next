/**
 * Property test for P5: BottomNav 活跃状态唯一性
 *
 * **Validates: Requirements 4.1**
 *
 * Property 5: For any arbitrary `pathname` string, at most one tab can be
 * active at a time.
 *
 * Active condition (mirrors BottomNav.tsx):
 *   pathname === t.href || pathname.startsWith(t.href + "/")
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Inline the tabs definition from BottomNav.tsx so the test has no dependency
// on React / next/navigation at all.
// ---------------------------------------------------------------------------

const tabs = [
  { href: "/dashboard" },
  { href: "/tracking" },
  { href: "/profile" },
];

/**
 * Returns the list of tabs that would be considered "active" for a given
 * pathname, using the same logic as BottomNav.tsx.
 */
function getActiveTabs(pathname: string) {
  return tabs.filter(
    (t) => pathname === t.href || pathname.startsWith(t.href + "/")
  );
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates arbitrary pathname strings.
 * We use a broad arbitrary (any string) to stress-test the uniqueness property,
 * plus focused arbitraries for the three known tab prefixes.
 */

/** Any string — covers random / adversarial inputs */
const anyPathnameArb = fc.string();

/** Pathname rooted at one of the three known tab hrefs */
const knownTabPathnameArb = fc
  .tuple(
    fc.constantFrom("/dashboard", "/tracking", "/profile"),
    fc.array(fc.stringMatching(/^[a-z0-9_-]{1,12}$/), {
      minLength: 0,
      maxLength: 4,
    })
  )
  .map(([base, segments]) =>
    segments.length === 0 ? base : `${base}/${segments.join("/")}`
  );

/** Pathname that does NOT start with any known tab href */
const unknownPathnameArb = fc
  .string()
  .filter(
    (s) =>
      !s.startsWith("/dashboard") &&
      !s.startsWith("/tracking") &&
      !s.startsWith("/profile")
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("P5 — BottomNav 活跃状态唯一性 (Property-Based)", () => {
  it(
    /**
     * **Validates: Requirements 4.1**
     *
     * For any arbitrary pathname, at most one tab is active.
     */
    "for any pathname, at most one tab is active",
    () => {
      fc.assert(
        fc.property(anyPathnameArb, (pathname) => {
          const active = getActiveTabs(pathname);
          expect(active.length).toBeLessThanOrEqual(1);
        }),
        { numRuns: 10000, verbose: true }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 4.1**
     *
     * For any pathname rooted at a known tab href, exactly one tab is active.
     */
    "for any pathname under a known tab href, exactly one tab is active",
    () => {
      fc.assert(
        fc.property(knownTabPathnameArb, (pathname) => {
          const active = getActiveTabs(pathname);
          expect(active.length).toBe(1);
        }),
        { numRuns: 1000, verbose: true }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 4.1**
     *
     * For any pathname that does not start with a known tab href, no tab is active.
     */
    "for any pathname not under a known tab href, no tab is active",
    () => {
      fc.assert(
        fc.property(unknownPathnameArb, (pathname) => {
          const active = getActiveTabs(pathname);
          expect(active.length).toBe(0);
        }),
        { numRuns: 1000, verbose: true }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Concrete edge-case examples
  // -------------------------------------------------------------------------

  it("exact tab hrefs each activate exactly one tab", () => {
    for (const tab of tabs) {
      expect(getActiveTabs(tab.href)).toHaveLength(1);
      expect(getActiveTabs(tab.href)[0].href).toBe(tab.href);
    }
  });

  it("sub-paths activate the correct parent tab only", () => {
    expect(getActiveTabs("/dashboard/alerts")).toHaveLength(1);
    expect(getActiveTabs("/tracking/123")).toHaveLength(1);
    expect(getActiveTabs("/profile/settings")).toHaveLength(1);
  });

  it("root path / activates no tab", () => {
    expect(getActiveTabs("/")).toHaveLength(0);
  });

  it("empty string activates no tab", () => {
    expect(getActiveTabs("")).toHaveLength(0);
  });

  it("a prefix that is a substring but not a path prefix does not activate", () => {
    // "/dashboardx" should NOT activate the /dashboard tab
    expect(getActiveTabs("/dashboardx")).toHaveLength(0);
    // "/trackingmore" should NOT activate the /tracking tab
    expect(getActiveTabs("/trackingmore")).toHaveLength(0);
  });
});
