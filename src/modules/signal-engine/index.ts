import { calcBollinger } from "@/lib/indicators/bollinger";
import { calcTDSequential } from "@/lib/indicators/td-sequential";
import type { KLineData } from "@/lib/stock-api/types";
import { getActiveStrategy } from "@/modules/signal-engine/registry";
import { toScanListItem, toStockDetailAnalysis } from "@/modules/signal-engine/adapters";
import type { AnalysisSnapshot, RuleInput } from "@/modules/signal-engine/types";

function buildRuleInput(code: string, name: string, klines: KLineData[]): RuleInput {
  const tdResults = calcTDSequential(klines);
  const bollinger = calcBollinger(klines.map((item) => item.close));

  return {
    code,
    name,
    klines,
    tdResults,
    bollinger,
  };
}

export function analyzeStockSnapshot(
  code: string,
  name: string,
  klines: KLineData[]
): AnalysisSnapshot {
  const input = buildRuleInput(code, name, klines);
  const strategy = getActiveStrategy();

  return {
    code,
    name,
    klines,
    tdResults: input.tdResults,
    bollinger: input.bollinger,
    evaluation: strategy.evaluate(input),
  };
}

export function analyzeStockDetail(code: string, name: string, klines: KLineData[]) {
  return toStockDetailAnalysis(analyzeStockSnapshot(code, name, klines));
}

export function buildScanItem(code: string, name: string, klines: KLineData[]) {
  return toScanListItem(analyzeStockSnapshot(code, name, klines));
}
