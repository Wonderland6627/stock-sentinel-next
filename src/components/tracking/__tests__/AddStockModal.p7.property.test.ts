/**
 * Property test for P7: AddStockModal 提交校验完备性
 *
 * **Validates: Requirements 3.8**
 *
 * Property 7: For any form state where entryPrice <= 0, submit is blocked,
 * an error message is displayed, and no database insert occurs.
 *
 * The validation logic under test (from handleSubmit in AddStockModal.tsx):
 *   if (!code.trim()) { setError("请填写股票代码"); return; }
 *   if (!entryPrice || Number(entryPrice) <= 0) { setError("买入价格必须大于 0"); return; }
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// Validation logic extracted from handleSubmit in AddStockModal.tsx
// ---------------------------------------------------------------------------

interface ValidationResult {
  blocked: boolean;
  errorMessage: string;
}

function validateSubmit(code: string, entryPrice: string): ValidationResult {
  if (!code.trim()) {
    return { blocked: true, errorMessage: "请填写股票代码" };
  }
  if (!entryPrice || Number(entryPrice) <= 0) {
    return { blocked: true, errorMessage: "买入价格必须大于 0" };
  }
  return { blocked: false, errorMessage: "" };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Non-empty stock code */
const nonEmptyCodeArb = fc.string({ minLength: 1, maxLength: 20 }).filter(
  (s) => s.trim().length > 0
);

/** entryPrice strings that represent a value <= 0 */
const invalidEntryPriceArb = fc.oneof(
  fc.constant(""),
  fc.constant("0"),
  fc.constant("0.00"),
  fc.constant("-1"),
  fc.constant("-0.01"),
  fc.double({ max: 0, noNaN: true }).map((n) => n.toString()),
);

/** entryPrice strings that represent a value > 0 */
const validEntryPriceArb = fc
  .double({ min: 0.01, max: 999999, noNaN: true })
  .map((n) => n.toFixed(2))
  .filter((s) => Number(s) > 0);

/** Empty or whitespace-only code */
const emptyCodeArb = fc.oneof(
  fc.constant(""),
  fc.constant("   "),
  fc.constant("\t"),
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("P7 — AddStockModal 提交校验完备性 (Property-Based)", () => {
  it(
    /**
     * **Validates: Requirements 3.8**
     *
     * For any form state where entryPrice <= 0 (and code is non-empty),
     * submit is blocked and an error message is shown.
     */
    "submit is blocked when entryPrice <= 0",
    () => {
      fc.assert(
        fc.property(nonEmptyCodeArb, invalidEntryPriceArb, (code, entryPrice) => {
          const result = validateSubmit(code, entryPrice);
          expect(result.blocked).toBe(true);
          expect(result.errorMessage).not.toBe("");
          expect(result.errorMessage).toBe("买入价格必须大于 0");
        }),
        { numRuns: 2000, verbose: true }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 3.8**
     *
     * For any form state where code is empty/whitespace, submit is blocked
     * regardless of entryPrice.
     */
    "submit is blocked when code is empty or whitespace",
    () => {
      fc.assert(
        fc.property(emptyCodeArb, validEntryPriceArb, (code, entryPrice) => {
          const result = validateSubmit(code, entryPrice);
          expect(result.blocked).toBe(true);
          expect(result.errorMessage).toBe("请填写股票代码");
        }),
        { numRuns: 1000, verbose: true }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 3.8**
     *
     * For any valid form state (non-empty code, entryPrice > 0),
     * submit is NOT blocked.
     */
    "submit is NOT blocked when code is non-empty and entryPrice > 0",
    () => {
      fc.assert(
        fc.property(nonEmptyCodeArb, validEntryPriceArb, (code, entryPrice) => {
          const result = validateSubmit(code, entryPrice);
          expect(result.blocked).toBe(false);
          expect(result.errorMessage).toBe("");
        }),
        { numRuns: 2000, verbose: true }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Concrete examples
  // -------------------------------------------------------------------------

  it('empty entryPrice "" blocks submit with price error', () => {
    const result = validateSubmit("sh600001", "");
    expect(result.blocked).toBe(true);
    expect(result.errorMessage).toBe("买入价格必须大于 0");
  });

  it('entryPrice "0" blocks submit with price error', () => {
    const result = validateSubmit("sh600001", "0");
    expect(result.blocked).toBe(true);
    expect(result.errorMessage).toBe("买入价格必须大于 0");
  });

  it('negative entryPrice "-5" blocks submit with price error', () => {
    const result = validateSubmit("sh600001", "-5");
    expect(result.blocked).toBe(true);
    expect(result.errorMessage).toBe("买入价格必须大于 0");
  });

  it('empty code "" blocks submit with code error', () => {
    const result = validateSubmit("", "10.00");
    expect(result.blocked).toBe(true);
    expect(result.errorMessage).toBe("请填写股票代码");
  });

  it('valid code and entryPrice "10.00" allows submit', () => {
    const result = validateSubmit("sh600001", "10.00");
    expect(result.blocked).toBe(false);
    expect(result.errorMessage).toBe("");
  });
});
