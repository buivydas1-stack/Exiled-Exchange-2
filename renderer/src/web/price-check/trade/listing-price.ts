import { displayRounding } from "@/web/background/Prices";
import type { PricingResult } from "./pathofexile-trade";

export function formatListingPrice(
  result: Pick<
    PricingResult,
    | "priceAmount"
    | "priceCurrency"
    | "normalizedPrice"
    | "normalizedPriceCurrency"
  >,
  divineChaosRate?: number,
): string {
  if (result.priceCurrency === "divine") {
    const chaos =
      divineChaosRate == null ? NaN : result.priceAmount * divineChaosRate;
    const equivalent =
      Number.isFinite(divineChaosRate) &&
      divineChaosRate! > 0 &&
      Number.isFinite(chaos) &&
      chaos >= 0
        ? ` (${displayRounding(chaos)}c)`
        : "";
    return `${result.priceAmount} Div${equivalent}`;
  }
  const equivalent =
    result.normalizedPriceCurrency &&
    result.priceCurrency !== result.normalizedPriceCurrency.id &&
    result.normalizedPrice
      ? ` (${result.normalizedPrice} ${result.normalizedPriceCurrency.abbrev})`
      : "";
  return `${result.priceAmount} ${result.priceCurrency}${equivalent}`;
}
