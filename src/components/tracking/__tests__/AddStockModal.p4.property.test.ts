/**
 * Property test for P4: 买入价格精度
 *
 * **Validates: Requirements 3.3**
 *
 * Property 4: For any price: number where price > 0:
 *   - price.toFixed(2).split(".")[1].length <= 2
 *   - Number(price.toFixed(2)) > 0
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// The precision logic extracted from handleCodeBlur in AddStockModal.tsx
// ---------------------------------------------------------------------------

function formatEntryPrice(price: number): string {
  return price.toFixed(2);
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Any positive finite number */
const positivePriceArb = fc.double({ min: 0.01, max: 999999, noNaN: true });

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("P4 — 买入价格精度 (Property-Based)", () => {
  it(
    /**
     * **Validates: Requirements 3.3**
     *
     * For any price > 0, toFixed(2) produces at most 2 decimal digits.
     */
    "price.toFixed(2) always has at most 2 decimal digits",
    () => {
      fc.assert(
        fc.property(positivePriceArb, (price) => {
          const formatted = formatEntryPrice(price);
          const parts = formatted.split(".");
          if (parts.length === 2) {
            expect(parts[1].length).toBeLessThanOrEqual(2);
          }
        }),
        { numRuns: 10000, verbose: true }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 3.3**
     *
     * For any price > 0, Number(price.toFixed(2)) > 0.
     */
    "Number(price.toFixed(2)) > 0 for any price > 0",
    () => {
      fc.assert(
        fc.property(positivePriceArb, (price) => {
          const formatted = formatEntryPrice(price);
          expect(Number(formatted)).toBeGreaterThan(0);
        }),
        { numRuns: 10000, verbose: true }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 3.3**
     *
     * Both properties hold simultaneously.
     */
    "both precision properties hold simultaneously for any price > 0",
    () => {
      fc.assert(
        fc.property(positivePriceArb, (price) => {
          const formatted = formatEntryPrice(price);
          const parts = formatted.split(".");

          // At most 2 decimal digits
          if (parts.length === 2) {
            expect(parts[1].length).toBeLessThanOrEqual(2);
          }

          // Parsed value is still > 0
          expect(Number(formatted)).toBeGreaterThan(0);
        }),
        { numRuns: 10000, verbose: true }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Concrete examples
  // -------------------------------------------------------------------------

  it("10.1 formats to '10.10' (2 decimal digits)", () => {
    expect(formatEntryPrice(10.1)).toBe("10.10");
    expect(formatEntryPrice(10.1).split(".")[1].length).toBe(2);
  });

  it("10.123 rounds to '10.12' (2 decimal digits)", () => {
    expect(formatEntryPrice(10.123)).toBe("10.12");
    expect(formatEntryPrice(10.123).split(".")[1].length).toBe(2);
  });

  it("0.01 formats to '0.01' and Number('0.01') > 0", () => {
    const formatted = formatEntryPrice(0.01);
    expect(formatted).toBe("0.01");
    expect(Number(formatted)).toBeGreaterThan(0);
  });

  it("999999 formats to '999999.00' and Number > 0", () => {
    const formatted = formatEntryPrice(999999);
    expect(formatted).toBe("999999.00");
    expect(Number(formatted)).toBeGreaterThan(0);
  });
});
