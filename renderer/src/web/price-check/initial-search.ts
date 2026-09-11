import { ItemCategory, ItemRarity, type ParsedItem } from "@/parser";
import { CATEGORY_TO_TRADE_ID } from "./trade/pathofexile-trade";

export function shouldStartInitialSearch(
  item: ParsedItem,
  advancedCheck: boolean,
  settings: { smartInitialSearch: boolean; lockedInitialSearch: boolean },
): boolean {
  // The locked price check (Ctrl+D) must honour auto-search for every item.
  if (advancedCheck) return settings.lockedInitialSearch;
  // Keep the quick/hold-mode heuristic separate from the locked-mode setting.
  return (
    settings.smartInitialSearch &&
    Boolean(
      item.rarity === ItemRarity.Unique ||
        item.category === ItemCategory.HeistBlueprint ||
        item.category === ItemCategory.SanctumRelic ||
        item.category === ItemCategory.Charm ||
        !CATEGORY_TO_TRADE_ID.has(item.category!) ||
        item.isUnidentified ||
        item.isVeiled,
    )
  );
}
