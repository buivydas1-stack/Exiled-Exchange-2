import ranges from "@/assets/map-roll-ranges.json";
import { ItemCategory, ItemRarity, type ParsedItem } from "@/parser";
import { incrRoll } from "@/parser/advanced-mod-desc";
import type { StatCalculated, StatSource } from "@/parser/modifiers";

// Bundled at startup. Build the lookup once, rather than scanning records per check.
interface RangeRecord {
  category: string;
  bases: string[];
  name: string;
  rolls: Record<string, [number, number]>;
}
const data = ranges as { records: RangeRecord[] };
const byRef = new Map<string, RangeRecord[]>();
for (const record of data.records) {
  for (const ref of Object.keys(record.rolls)) {
    const records = byRef.get(ref) ?? [];
    records.push(record);
    byRef.set(ref, records);
  }
}

export function isMapOrTablet(item: ParsedItem): boolean {
  return (
    item.category === ItemCategory.Map || item.category === ItemCategory.Tablet
  );
}

function knownBounds(
  source: StatSource,
  item: ParsedItem,
): [number, number] | undefined {
  const roll = source.contributes;
  if (!roll) return;
  if (source.stat.translation.value !== undefined)
    return [roll.value, roll.value];
  // A variable copied range is evidence; value=min=max alone is not.
  if (roll.min !== roll.max) return [roll.min, roll.max];
  if (item.rarity === ItemRarity.Unique) return;
  const category = item.category === ItemCategory.Map ? "Waystones" : "Tablet";
  const base =
    category === "Waystones"
      ? `Waystone (Tier ${item.mapTier})`
      : item.info.refName;
  let candidates = (byRef.get(source.stat.stat.ref) ?? []).filter(
    (record) => record.category === category && record.bases.includes(base),
  );
  // Names are optional and localized. Only narrow them when an exact match exists.
  const named = candidates.filter(
    (record) => record.name === source.modifier.info.name,
  );
  if (named.length) candidates = named;
  const choices = new Map<string, [number, number]>();
  for (const candidate of candidates) {
    const raw = (candidate.rolls as Record<string, number[]>)[
      source.stat.stat.ref
    ];
    const percent = source.modifier.info.rollIncr ?? 0;
    const dp = source.stat.roll?.dp ? 2 : 0;
    const lo = incrRoll(raw[0], percent, dp);
    const hi = incrRoll(raw[1], percent, dp);
    if (roll.value >= lo && roll.value <= hi)
      choices.set(`${lo}:${hi}`, [lo, hi]);
  }
  // Ambiguous or unsupported ranges keep the selected tolerance.
  return choices.size === 1 ? choices.values().next().value : undefined;
}

export function isVerifiedPerfectMapRoll(
  calc: StatCalculated,
  item: ParsedItem,
): boolean {
  if (!isMapOrTablet(item) || calc.stat.better !== 1 || !calc.sources.length)
    return false;
  return calc.sources.every((source) => {
    const bounds = knownBounds(source, item);
    return bounds !== undefined && source.contributes!.value === bounds[1];
  });
}
