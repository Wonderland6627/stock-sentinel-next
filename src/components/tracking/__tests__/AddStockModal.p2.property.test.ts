/**
 * Property test for P2: QuoteAPI 自动填充幂等性
 *
 * **Validates: Requirements 3.3**
 *
 * Property 2: For any valid StockQuote where price > 0 and name !== "",
 * calling the auto-fill logic twice produces the same entryPrice and name
 * values both times.
 *
 * The logic under test (from handleCodeBlur in AddStockModal.tsx):
 *   setName(quote.name)
 *   setEntryPrice(quote.price.toFixed(2))
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { StockQuote } from "@/lib/stock-api/types";

// ---------------------------------------------------------------------------
// The auto-fill logic extracted from handleCodeBlur
// ---------------------------------------------------------------------------

function applyAutoFill(quote: StockQuote): { name: string; entryPrice: string } {
  return {
    name: quote.name,
    entryPrice: quote.price.toFixed(2),
  };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Valid StockQuote with price > 0 and non-empty name */
const validQuoteArb: fc.Arbitrary<StockQuote> = fc.record({
  code: fc.stringMatching(/^[a-z]{2}\d{6}$/),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  price: fc.double({ min: 0.01, max: 99999, noNaN: true }),
  change: fc.double({ min: -1000, max: 1000, noNaN: true }),
  changePercent: fc.double({ min: -20, max: 20, noNaN: true }),
  high: fc.double({ min: 0.01, max: 99999, noNaN: true }),
  low: fc.double({ min: 0.01, max: 99999, noNaN: true }),
  open: fc.double({ min: 0.01, max: 99999, noNaN: true }),
  prevClose: fc.double({ min: 0.01, max: 99999, noNaN: true }),
  volume: fc.double({ min: 0, max: 1e12, noNaN: true }),
  turnover: fc.double({ min: 0, max: 1e15, noNaN: true }),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("P2 — QuoteAPI 自动填充幂等性 (Property-Based)", () => {
  it(
    /**
     * **Validates: Requirements 3.3**
     *
     * For any valid StockQuote (price > 0, name non-empty), applying the
     * auto-fill logic twice yields identical name and entryPrice both times.
     */
    "applying auto-fill twice produces identical name and entryPrice",
    () => {
      fc.assert(
        fc.property(validQuoteArb, (quote) => {
          const first = applyAutoFill(quote);
          const second = applyAutoFill(quote);

          expect(first.name).toBe(second.name);
          expect(first.entryPrice).toBe(second.entryPrice);
        }),
        { numRuns: 5000, verbose: true }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 3.3**
     *
     * entryPrice is always the price formatted to exactly 2 decimal places.
     */
    "entryPrice always has at most 2 decimal places",
    () => {
      fc.assert(
        fc.property(validQuoteArb, (quote) => {
          const { entryPrice } = applyAutoFill(quote);
          const parts = entryPrice.split(".");
          // Either no decimal point, or at most 2 decimal digits
          if (parts.length === 2) {
            expect(parts[1].length).toBeLessThanOrEqual(2);
          }
        }),
        { numRuns: 5000, verbose: true }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 3.3**
     *
     * entryPrice parsed back to a number is always > 0 when price > 0.
     */
    "entryPrice parsed back to number is > 0 when price > 0",
    () => {
      fc.assert(
        fc.property(validQuoteArb, (quote) => {
          const { entryPrice } = applyAutoFill(quote);
          expect(Number(entryPrice)).toBeGreaterThan(0);
        }),
        { numRuns: 5000, verbose: true }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Concrete examples
  // -------------------------------------------------------------------------

  it("price 10.123 formats to '10.12'", () => {
    const quote = { code: "sh600001", name: "招商银行", price: 10.123 } as StockQuote;
    expect(applyAutoFill(quote).entryPrice).toBe("10.12");
  });

  it("price 10.999 formats to '11.00'", () => {
    const quote = { code: "sh600001", name: "招商银行", price: 10.999 } as StockQuote;
    expect(applyAutoFill(quote).entryPrice).toBe("11.00");
  });

  it("name is preserved exactly", () => {
    const quote = { code: "sh600001", name: "招商银行", price: 50 } as StockQuote;
    expect(applyAutoFill(quote).name).toBe("招商银行");
  });
});
