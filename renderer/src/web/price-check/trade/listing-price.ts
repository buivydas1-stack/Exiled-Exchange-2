import { formatChaosEquivalent } from "../stack-value/format-chaos-equivalent";
import type { PricingResult } from "./pathofexile-trade";

export function formatListingPrice(
  result: Pick<
    PricingResult,
    "priceAmount" | "priceCurrency" | "priceInDivines"
  >,
  divineChaosRate?: number,
  exaltedChaosRate?: number,
): string {
  const chaos =
    result.priceCurrency === "chaos"
      ? undefined
      : result.priceCurrency === "divine"
        ? formatChaosEquivalent(result.priceAmount, divineChaosRate)
        : result.priceCurrency === "exalted"
          ? formatChaosEquivalent(result.priceAmount, exaltedChaosRate)
          : result.priceInDivines !== undefined
            ? formatChaosEquivalent(result.priceInDivines, divineChaosRate)
            : undefined;
  const equivalent = chaos === undefined ? "" : ` (${chaos}c)`;
  const currency =
    result.priceCurrency === "divine" ? "Div" : result.priceCurrency;
  return `${result.priceAmount} ${currency}${equivalent}`;
}
