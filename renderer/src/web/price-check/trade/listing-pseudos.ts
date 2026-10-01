import { STAT_BY_REF } from "@/assets/data";
import {
  ModifierType,
  statSourcesTotal,
  translateStatWithRoll,
} from "@/parser/modifiers";
import type { StatSource } from "@/parser/modifiers";
import {
  linesToStatStrings,
  tryParseTranslation,
} from "@/parser/stat-translations";
import { listingPseudoRules, resistanceElements } from "../filters/pseudo";
import { roundRoll } from "../filters/util";
import type { DisplayItem } from "./pathofexile-trade";

interface ListingPseudo {
  ref: string;
  text: string;
}

const DEFAULT_TOTALS = new Set([
  "+# total maximum Life",
  "+# total maximum Mana",
  "#% total to Chaos Resistance",
  "#% total Resistance",
  "#% total Elemental Resistance",
]);

// The display item is immutable for a fetched listing. Cache on first hover,
// rather than doing parsing while searching or whenever the tooltip remounts.
const cache = new WeakMap<DisplayItem, ListingPseudo[]>();

export function listingPseudos(
  item: DisplayItem,
  selectedRefs: readonly string[] = [],
) {
  let totals = cache.get(item);
  if (!totals) {
    totals = calculateTotals(item);
    cache.set(item, totals);
  }
  return totals.filter(
    (total) =>
      ![
        "#% total to Fire Resistance",
        "#% total to Cold Resistance",
        "#% total to Lightning Resistance",
        "#% total to all Elemental Resistances",
      ].includes(total.ref) &&
      (DEFAULT_TOTALS.has(total.ref) || selectedRefs.includes(total.ref)),
  );
}

function calculateTotals(item: DisplayItem): ListingPseudo[] {
  const sources: StatSource[] = [];
  const blocks = [
    [ModifierType.Implicit, item.implicitMods],
    [ModifierType.Explicit, item.explicitMods],
    [ModifierType.Crafted, item.craftedMods],
    [ModifierType.Fractured, item.fracturedMods],
    [ModifierType.Desecrated, item.desecratedMods],
    [ModifierType.Explicit, item.mutatedMods],
    [ModifierType.Enchant, item.enchantMods],
    [ModifierType.Augment, item.runeMods],
  ] as const;
  for (const [type, mods] of blocks) {
    for (const mod of mods ?? []) {
      const strings = linesToStatStrings(mod.text.split("\n"));
      let next = strings.next();
      while (!next.done) {
        const parsed = tryParseTranslation(next.value, type, undefined);
        if (parsed?.roll) {
          sources.push({
            stat: parsed,
            modifier: { info: { type, tags: [] }, stats: [parsed] },
            contributes: parsed.roll,
          });
        }
        next = strings.next(Boolean(parsed));
      }
    }
  }

  // Keep any pseudos already supplied by the trade response, without duplicates.
  const supplied = new Set(
    (item.pseudoMods ?? []).map(
      (mod) =>
        (
          tryParseTranslation(
            { string: mod.text, unscalable: false },
            ModifierType.Pseudo,
            undefined,
          ) ??
          tryParseTranslation(
            { string: mod.text.trim().replace(/^\+/, ""), unscalable: false },
            ModifierType.Pseudo,
            undefined,
          )
        )?.stat.ref,
    ),
  );
  const totals: ListingPseudo[] = [];
  for (const rule of listingPseudoRules()) {
    if (supplied.has(rule.pseudo)) continue;
    const contributing = sources.flatMap((source) => {
      const part = rule.stats.find((part) => part.ref === source.stat.stat.ref);
      if (!part) return [];
      const multiplier = part.multiplier ?? 1;
      const roll = source.contributes!;
      return [
        {
          ...source,
          contributes: {
            value: roll.value * multiplier,
            min: roll.min * multiplier,
            max: roll.max * multiplier,
          },
        },
      ];
    });
    if (
      !contributing.length ||
      rule.stats.some(
        (part) =>
          part.required &&
          !contributing.some((source) => source.stat.stat.ref === part.ref),
      )
    )
      continue;
    const stat = STAT_BY_REF(rule.pseudo);
    if (!stat) continue;
    const calc = { stat, type: ModifierType.Pseudo, sources: contributing };
    const roll = statSourcesTotal(contributing)!;
    if (rule.group === "to_all_res") {
      const elements = ["fire", "cold", "lightning"] as const;
      roll.value = Math.min(
        ...elements.map((element) =>
          sources.reduce(
            (sum, source) =>
              sum +
              (resistanceElements(source.stat.stat.ref)?.elements.includes(
                element,
              )
                ? source.contributes!.value
                : 0),
            0,
          ),
        ),
      );
      roll.min = roll.max = roll.value;
    }
    if (!roll.value) continue;
    const translation = translateStatWithRoll(calc, roll);
    const value = roundRoll(
      translation.negate ? -roll.value : roll.value,
      translation.dp ?? false,
    );
    let text = translation.string.trim().replace("#", String(value));
    if (
      [
        "#% total Elemental Resistance",
        "#% total to Chaos Resistance",
      ].includes(rule.pseudo) &&
      value > 0
    )
      text = `+${text}`;
    totals.push({ ref: rule.pseudo, text });
  }

  const resistanceSources = sources.filter((source) =>
    resistanceElements(source.stat.stat.ref),
  );
  const resistanceTotals = resistanceSources.reduce(
    (sum, source) => {
      const info = resistanceElements(source.stat.stat.ref)!;
      sum.elemental += source.contributes!.value * info.elements.length;
      sum.chaos += info.chaos ? source.contributes!.value : 0;
      return sum;
    },
    { elemental: 0, chaos: 0 },
  );
  // A combined total only adds information when both types contribute.
  if (
    resistanceTotals.elemental &&
    resistanceTotals.chaos &&
    !supplied.has("#% total Resistance")
  ) {
    const value = resistanceTotals.elemental + resistanceTotals.chaos;
    if (value)
      totals.push({
        ref: "#% total Resistance",
        text: `${value > 0 ? "+" : ""}${value}% total Resistance`,
      });
  }
  const normalize = (text: string) =>
    text.trim().replace(/^\+/, "").toLowerCase();
  const suppliedText = new Set(
    (item.pseudoMods ?? []).map((mod) => normalize(mod.text)),
  );
  const order = [...DEFAULT_TOTALS];
  return totals
    .filter((total) => !suppliedText.has(normalize(total.text)))
    .sort((a, b) => {
      const rank = (ref: string) =>
        order.includes(ref) ? order.indexOf(ref) : order.length;
      return rank(a.ref) - rank(b.ref);
    });
}
