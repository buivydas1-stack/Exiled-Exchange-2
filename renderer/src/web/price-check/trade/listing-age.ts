const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function isListingAtLeastOneDayOld(
  indexed: string,
  now = Date.now(),
): boolean {
  const indexedAt = Date.parse(indexed);

  return Number.isFinite(indexedAt) && now - indexedAt >= ONE_DAY_MS;
}
