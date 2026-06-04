import { td9BollV1Strategy } from "@/modules/signal-engine/strategies/td9_boll_v1/strategy";
import type { ScanStrategy } from "@/modules/signal-engine/types";

const registry: Record<string, ScanStrategy> = {
  [td9BollV1Strategy.id]: td9BollV1Strategy,
};

const DEFAULT_STRATEGY_ID = td9BollV1Strategy.id;

export function getRegisteredStrategies(): ScanStrategy[] {
  return Object.values(registry);
}

export function getActiveStrategy(): ScanStrategy {
  const configuredId = process.env.ACTIVE_SCAN_STRATEGY ?? DEFAULT_STRATEGY_ID;
  return registry[configuredId] ?? registry[DEFAULT_STRATEGY_ID];
}
