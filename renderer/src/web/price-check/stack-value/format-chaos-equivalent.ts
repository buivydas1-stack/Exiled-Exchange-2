import { displayRounding } from "@/web/background/Prices";

export function formatChaosEquivalent(
  exaltedAmount: number,
  exaltedChaosRate?: number,
): string | undefined {
  if (
    exaltedChaosRate == null ||
    !Number.isFinite(exaltedChaosRate) ||
    exaltedChaosRate <= 0 ||
    !Number.isFinite(exaltedAmount) ||
    exaltedAmount < 0
  ) {
    return undefined;
  }

  const chaos = exaltedAmount * exaltedChaosRate;
  if (!Number.isFinite(chaos)) return undefined;
  return chaos > 0 && chaos < 0.1
    ? Number(chaos.toPrecision(2)).toString()
    : displayRounding(chaos, false, true);
}
