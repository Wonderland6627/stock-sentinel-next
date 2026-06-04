import { createServiceClient } from "@/lib/supabase/service";
import type { StrategyRunRecord } from "@/modules/signal-engine/types";

export async function logStrategyRun(record: StrategyRunRecord) {
  const supabase = createServiceClient();
  if (!supabase) {
    return;
  }

  await supabase.from("strategy_runs").insert({
    strategy_id: record.strategyId,
    strategy_version: record.strategyVersion,
    stock_pool_version: record.stockPoolVersion,
    matched_count: record.matchedCount,
    sample_codes: record.sampleCodes,
    duration_ms: record.durationMs,
    error_count: record.errorCount,
    notes: record.notes ?? {},
    run_at: record.runAt ?? new Date().toISOString(),
  });
}
