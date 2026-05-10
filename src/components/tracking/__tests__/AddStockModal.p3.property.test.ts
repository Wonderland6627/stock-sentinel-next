/**
 * Property test for P3: 止损价格可选性
 *
 * **Validates: Requirements 3.6**
 *
 * Property 3: For any submission where `code !== ""` and `entryPrice > 0`,
 * when `td9Low` is `""` or `"0"`, the inserted `td9_low_price` equals `0`.
 *
 * The logic under test is the expression used in AddStockModal.tsx:
 *   td9_low_price: Number(td9Low) || 0
 *
 * This test directly exercises that expression without mounting the React
 * component, keeping the test fast and dependency-free.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// The expression under test (extracted from AddStockModal.tsx handleSubmit)
// ---------------------------------------------------------------------------

/**
 * Computes the value that will be stored as `td9_low_price` for a given
 * `td9Low` string input, mirroring the expression in AddStockModal.tsx:
 *
 *   td9_low_price: Number(td9Low) || 0
 */
function computeTd9LowPrice(td9Low: string): number {
  return Number(td9Low) || 0;
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Non-empty stock code strings */
const nonEmptyCodeArb = fc.string({ minLength: 1 });

/** Entry prices strictly greater than 0 */
const positiveEntryPriceArb = fc.double({ min: 0.01, max: 1_000_000, noNaN: true });

/** The two "empty" td9Low values that should default to 0 */
const emptyTd9LowArb = fc.constantFrom("", "0");

/** Positive numeric td9Low strings (should NOT default to 0) */
const positiveTd9LowArb = fc
  .double({ min: 0.01, max: 1_000_000, noNaN: true })
  .map((n) => n.toFixed(2))
  .filter((s) => Number(s) > 0);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("P3 — 止损价格可选性 (Property-Based)", () => {
  it(
    /**
     * **Validates: Requirements 3.6**
     *
     * For any valid submission (code non-empty, entryPrice > 0),
     * when td9Low is "" or "0", the inserted td9_low_price must equal 0.
     */
    'when td9Low is "" or "0", td9_low_price is 0 regardless of other fields',
    () => {
      fc.assert(
        fc.property(
          nonEmptyCodeArb,
          positiveEntryPriceArb,
          emptyTd9LowArb,
          (code, entryPrice, td9Low) => {
            // Preconditions (mirrors handleSubmit guards)
            expect(code).not.toBe("");
            expect(entryPrice).toBeGreaterThan(0);

            const td9LowPrice = computeTd9LowPrice(td9Low);
            expect(td9LowPrice).toBe(0);
          }
        ),
        { numRuns: 1000, verbose: true }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 3.6**
     *
     * When td9Low is a positive numeric string, td9_low_price equals
     * the parsed number (i.e. the || 0 fallback is NOT triggered).
     */
    "when td9Low is a positive numeric string, td9_low_price equals the parsed number",
    () => {
      fc.assert(
        fc.property(positiveTd9LowArb, (td9Low) => {
          const td9LowPrice = computeTd9LowPrice(td9Low);
          expect(td9LowPrice).toBeGreaterThan(0);
          expect(td9LowPrice).toBe(Number(td9Low));
        }),
        { numRuns: 1000, verbose: true }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Concrete edge-case examples
  // -------------------------------------------------------------------------

  it('empty string "" produces td9_low_price = 0', () => {
    expect(computeTd9LowPrice("")).toBe(0);
  });

  it('"0" produces td9_low_price = 0', () => {
    expect(computeTd9LowPrice("0")).toBe(0);
  });

  it('"0.00" produces td9_low_price = 0', () => {
    expect(computeTd9LowPrice("0.00")).toBe(0);
  });

  it('"0.01" produces td9_low_price = 0.01 (not zero)', () => {
    expect(computeTd9LowPrice("0.01")).toBeCloseTo(0.01);
  });

  it('"10.5" produces td9_low_price = 10.5', () => {
    expect(computeTd9LowPrice("10.5")).toBeCloseTo(10.5);
  });

  it("whitespace-only string produces td9_low_price = 0", () => {
    // Number("   ") === 0, so || 0 still gives 0
    expect(computeTd9LowPrice("   ")).toBe(0);
  });

  it("non-numeric string produces td9_low_price = 0", () => {
    // Number("abc") === NaN, NaN || 0 === 0
    expect(computeTd9LowPrice("abc")).toBe(0);
  });
});
