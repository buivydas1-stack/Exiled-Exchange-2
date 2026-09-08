const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export function isListingAtLeastTwelveHoursOld(
  indexed: string,
  now = Date.now(),
): boolean {
  const indexedAt = Date.parse(indexed);

  return Number.isFinite(indexedAt) && now - indexedAt >= TWELVE_HOURS_MS;
}
