export function formatChaosEquivalent(
  amount: number,
  chaosRate?: number,
): string | undefined {
  if (
    chaosRate == null ||
    !Number.isFinite(chaosRate) ||
    chaosRate <= 0 ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    return undefined;
  }

  const chaos = amount * chaosRate;
  if (!Number.isFinite(chaos)) return undefined;
  return chaos < 0.01 ? "0.00" : chaos.toFixed(2);
}
