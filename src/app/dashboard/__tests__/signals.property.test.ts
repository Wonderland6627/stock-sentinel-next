/**
 * Property test for P1: 信号分区互斥性
 *
 * **Validates: Requirements 1.2, 1.3**
 *
 * Property 1: For any arbitrary StockSignal[], the td9Signals and
 * pendingSignals partitions are mutually exclusive and each contains only
 * signals with the expected tdSetup values.
 *
 * Partition logic (mirrors dashboard/page.tsx):
 *   td9Signals     = signals.filter(s => s.tdSetup === 9)
 *   pendingSignals = signals.filter(s => s.tdSetup >= 7 && s.tdSetup < 9)
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { StockSignal } from "@/lib/stock-api/types";

// ---------------------------------------------------------------------------
// Partition logic — inlined from dashboard/page.tsx so the test has no
// dependency on React or browser APIs.
// ---------------------------------------------------------------------------

function partitionSignals(signals: StockSignal[]) {
  const td9Signals = signals.filter((s) => s.tdSetup === 9);
  const pendingSignals = signals.filter(
    (s) => s.tdSetup >= 7 && s.tdSetup < 9
  );
  return { td9Signals, pendingSignals };
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a single StockSignal with an arbitrary tdSetup value (0–13). */
const stockSignalArb: fc.Arbitrary<StockSignal> = fc.record({
  code: fc.stringMatching(/^[a-z]{2}\d{6}$/),
  name: fc.string({ minLength: 1, maxLength: 10 }),
  price: fc.float({ min: Math.fround(0.01), max: Math.fround(9999), noNaN: true }),
  changePercent: fc.float({ min: Math.fround(-20), max: Math.fround(20), noNaN: true }),
  tdSetup: fc.integer({ min: 0, max: 13 }),
  bollingerLower: fc.float({ min: Math.fround(0.01), max: Math.fround(9999), noNaN: true }),
  bollingerMid: fc.float({ min: Math.fround(0.01), max: Math.fround(9999), noNaN: true }),
  bollingerUpper: fc.float({ min: Math.fround(0.01), max: Math.fround(9999), noNaN: true }),
  signalType: fc.constantFrom(
    "buy_td9" as const,
    "buy_td13" as const,
    "sell_mid" as const,
    "sell_upper" as const
  ),
});

/** Generates an arbitrary array of StockSignals (0–50 items). */
const stockSignalArrayArb: fc.Arbitrary<StockSignal[]> = fc.array(
  stockSignalArb,
  { minLength: 0, maxLength: 50 }
);

/** Generates a StockSignal with tdSetup fixed to 9 (td9 signal). */
const td9SignalArb: fc.Arbitrary<StockSignal> = stockSignalArb.map((s) => ({
  ...s,
  tdSetup: 9,
}));

/** Generates a StockSignal with tdSetup fixed to 7 or 8 (pending signal). */
const pendingSignalArb: fc.Arbitrary<StockSignal> = fc
  .tuple(stockSignalArb, fc.constantFrom(7, 8))
  .map(([s, setup]) => ({ ...s, tdSetup: setup }));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("P1 — 信号分区互斥性 (Property-Based)", () => {
  it(
    /**
     * **Validates: Requirements 1.2, 1.3**
     *
     * For any arbitrary StockSignal[], td9Signals and pendingSignals are
     * disjoint sets (no stock code appears in both).
     */
    "td9Signals ∩ pendingSignals = ∅ for any arbitrary signal array",
    () => {
      fc.assert(
        fc.property(stockSignalArrayArb, (signals) => {
          const { td9Signals, pendingSignals } = partitionSignals(signals);

          const td9Codes = new Set(td9Signals.map((s) => s.code));
          const pendingCodes = new Set(pendingSignals.map((s) => s.code));

          // Intersection must be empty
          for (const code of td9Codes) {
            expect(pendingCodes.has(code)).toBe(false);
          }
        }),
        { numRuns: 10000, verbose: true }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 1.2**
     *
     * Every signal in td9Signals has tdSetup === 9.
     */
    "td9Signals.every(s => s.tdSetup === 9)",
    () => {
      fc.assert(
        fc.property(stockSignalArrayArb, (signals) => {
          const { td9Signals } = partitionSignals(signals);
          expect(td9Signals.every((s) => s.tdSetup === 9)).toBe(true);
        }),
        { numRuns: 10000, verbose: true }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 1.3**
     *
     * Every signal in pendingSignals has tdSetup === 7 or tdSetup === 8.
     */
    "pendingSignals.every(s => s.tdSetup === 7 || s.tdSetup === 8)",
    () => {
      fc.assert(
        fc.property(stockSignalArrayArb, (signals) => {
          const { pendingSignals } = partitionSignals(signals);
          expect(
            pendingSignals.every((s) => s.tdSetup === 7 || s.tdSetup === 8)
          ).toBe(true);
        }),
        { numRuns: 10000, verbose: true }
      );
    }
  );

  it(
    /**
     * **Validates: Requirements 1.2, 1.3**
     *
     * All three properties hold simultaneously for any signal array.
     */
    "all three mutual-exclusivity properties hold simultaneously",
    () => {
      fc.assert(
        fc.property(stockSignalArrayArb, (signals) => {
          const { td9Signals, pendingSignals } = partitionSignals(signals);

          const td9Codes = new Set(td9Signals.map((s) => s.code));
          const pendingCodes = new Set(pendingSignals.map((s) => s.code));

          // P1a: disjoint
          for (const code of td9Codes) {
            expect(pendingCodes.has(code)).toBe(false);
          }

          // P1b: td9 contains only tdSetup=9
          expect(td9Signals.every((s) => s.tdSetup === 9)).toBe(true);

          // P1c: pending contains only tdSetup=7 or 8
          expect(
            pendingSignals.every((s) => s.tdSetup === 7 || s.tdSetup === 8)
          ).toBe(true);
        }),
        { numRuns: 5000, verbose: true }
      );
    }
  );

  // -------------------------------------------------------------------------
  // Concrete examples
  // -------------------------------------------------------------------------

  it("a td9 signal (tdSetup=9) lands only in td9Signals", () => {
    fc.assert(
      fc.property(td9SignalArb, (signal) => {
        const { td9Signals, pendingSignals } = partitionSignals([signal]);
        expect(td9Signals).toHaveLength(1);
        expect(pendingSignals).toHaveLength(0);
      }),
      { numRuns: 1000 }
    );
  });

  it("a pending signal (tdSetup=7 or 8) lands only in pendingSignals", () => {
    fc.assert(
      fc.property(pendingSignalArb, (signal) => {
        const { td9Signals, pendingSignals } = partitionSignals([signal]);
        expect(td9Signals).toHaveLength(0);
        expect(pendingSignals).toHaveLength(1);
      }),
      { numRuns: 1000 }
    );
  });

  it("empty signal array produces empty partitions", () => {
    const { td9Signals, pendingSignals } = partitionSignals([]);
    expect(td9Signals).toHaveLength(0);
    expect(pendingSignals).toHaveLength(0);
  });

  it("signals with tdSetup outside 7-9 appear in neither partition", () => {
    const outsideSetups = [0, 1, 2, 3, 4, 5, 6, 10, 11, 12, 13];
    for (const setup of outsideSetups) {
      const signal: StockSignal = {
        code: "sh600001",
        name: "测试股票",
        price: 10,
        changePercent: 0,
        tdSetup: setup,
        bollingerLower: 9,
        bollingerMid: 10,
        bollingerUpper: 11,
        signalType: "buy_td9",
      };
      const { td9Signals, pendingSignals } = partitionSignals([signal]);
      expect(td9Signals).toHaveLength(0);
      expect(pendingSignals).toHaveLength(0);
    }
  });

  it("mixed array correctly partitions td9 and pending signals", () => {
    const signals: StockSignal[] = [
      {
        code: "sh600001",
        name: "股票A",
        price: 10,
        changePercent: 1,
        tdSetup: 9,
        bollingerLower: 9,
        bollingerMid: 10,
        bollingerUpper: 11,
        signalType: "buy_td9",
      },
      {
        code: "sz000001",
        name: "股票B",
        price: 20,
        changePercent: -1,
        tdSetup: 7,
        bollingerLower: 19,
        bollingerMid: 20,
        bollingerUpper: 21,
        signalType: "buy_td9",
      },
      {
        code: "sh600002",
        name: "股票C",
        price: 30,
        changePercent: 0,
        tdSetup: 8,
        bollingerLower: 29,
        bollingerMid: 30,
        bollingerUpper: 31,
        signalType: "buy_td9",
      },
      {
        code: "sz000002",
        name: "股票D",
        price: 40,
        changePercent: 2,
        tdSetup: 5,
        bollingerLower: 39,
        bollingerMid: 40,
        bollingerUpper: 41,
        signalType: "buy_td9",
      },
    ];

    const { td9Signals, pendingSignals } = partitionSignals(signals);

    expect(td9Signals).toHaveLength(1);
    expect(td9Signals[0].code).toBe("sh600001");

    expect(pendingSignals).toHaveLength(2);
    expect(pendingSignals.map((s) => s.code).sort()).toEqual(
      ["sh600002", "sz000001"].sort()
    );
  });
});
