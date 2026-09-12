import { ParsedItem } from "@/parser";
import { AppConfig } from "@/web/Config";
import { shallowRef, computed, shallowReactive } from "vue";
import { ItemFilters, StatFilter } from "../filters/interfaces";
import {
  SearchResult,
  PricingResult,
  createTradeRequest,
  requestTradeResultList,
  requestResults,
} from "@/web/price-check/trade/pathofexile-trade";

const API_FETCH_LIMIT = 100;
const MIN_NOT_GROUPED = 7;
const MIN_GROUPED = 10;
const LOAD_MORE_SIZE = 20;

export function useTradeApi() {
  let searchId = 0;
  let fetchNextPage: (() => Promise<void>) | undefined;
  const error = shallowRef<string | null>(null);
  const searchResult = shallowRef<SearchResult | null>(null);
  const fetchResults = shallowRef<PricingResult[]>([]);
  const hasMore = shallowRef(false);
  const loadingMore = shallowRef(false);
  const loadMoreError = shallowRef<string | null>(null);

  const groupedResults = computed(() => {
    const out: Array<PricingResult & { listedTimes: number }> = [];
    for (const result of fetchResults.value) {
      if (result == null) break;
      if (out.length === 0) {
        out.push({ listedTimes: 1, ...result });
        continue;
      }
      const existingRes = out.find(
        (added, idx) =>
          (added.accountName === result.accountName &&
            added.priceCurrency === result.priceCurrency &&
            added.priceAmount === result.priceAmount) ||
          (added.accountName === result.accountName && out.length - idx <= 2), // last or prev
      );
      if (existingRes) {
        if (existingRes.stackSize) {
          existingRes.stackSize += result.stackSize!;
        } else {
          existingRes.listedTimes += 1;
        }
      } else {
        out.push({ listedTimes: 1, ...result });
      }
    }
    return out;
  });

  async function search(
    filters: ItemFilters,
    stats: StatFilter[],
    item: ParsedItem,
  ) {
    const _searchId = ++searchId;
    try {
      error.value = null;
      searchResult.value = null;
      fetchNextPage = undefined;
      hasMore.value = false;
      loadingMore.value = false;
      loadMoreError.value = null;
      const _fetchResults: PricingResult[] = shallowReactive([]);
      fetchResults.value = _fetchResults;

      const request = createTradeRequest(filters, stats, item);
      const _searchResult = await requestTradeResultList(
        request,
        filters.trade.league,
      );
      if (_searchId !== searchId) {
        return;
      }
      searchResult.value = _searchResult;

      // first two req are parallel, then sequential on demand
      {
        const r1 =
          _searchResult.result.length > 0
            ? requestResults(
                _searchResult.id,
                _searchResult.result.slice(0, 10),
                { accountName: AppConfig().accountName },
              ).then((results) => {
                _fetchResults.push(...results);
              })
            : Promise.resolve();
        const r2 =
          _searchResult.result.length > 10
            ? requestResults(
                _searchResult.id,
                _searchResult.result.slice(10, 20),
                { accountName: AppConfig().accountName },
              ).then(async (results) => {
                await r1.then(() => {
                  _fetchResults.push(...results);
                });
              })
            : Promise.resolve();
        await Promise.all([r1, r2]);
      }

      let fetched = Math.min(20, _searchResult.result.length);
      async function fetchNextBatch(): Promise<void> {
        if (_searchId !== searchId) return;
        const ids = _searchResult.result.slice(fetched, fetched + 10);
        const results = await requestResults(_searchResult.id, ids, {
          accountName: AppConfig().accountName,
        });
        if (_searchId !== searchId) return;
        _fetchResults.push(...results);
        // Advance by requested IDs, including listings removed since searching.
        fetched += ids.length;
      }
      async function fetchMore(): Promise<void> {
        if (_searchId !== searchId) return;
        const totalGrouped = groupedResults.value.length;
        const totalNotGrouped = groupedResults.value.reduce(
          (len, res) => (res.listedTimes <= 2 ? len + 1 : len),
          0,
        );
        if (
          (totalNotGrouped < MIN_NOT_GROUPED || totalGrouped < MIN_GROUPED) &&
          fetched < _searchResult.result.length &&
          fetched < API_FETCH_LIMIT
        ) {
          await fetchNextBatch();
          await fetchMore();
        }
      }
      await fetchMore();
      if (_searchId !== searchId) return;
      hasMore.value = fetched < _searchResult.result.length;
      fetchNextPage = async () => {
        const end = Math.min(
          fetched + LOAD_MORE_SIZE,
          _searchResult.result.length,
        );
        while (fetched < end) {
          if (_searchId !== searchId) return;
          await fetchNextBatch();
          if (_searchId === searchId) {
            hasMore.value = fetched < _searchResult.result.length;
          }
        }
      };
    } catch (err) {
      if (_searchId === searchId) error.value = (err as Error).message;
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value || !fetchNextPage) return;
    const _searchId = searchId;
    loadingMore.value = true;
    loadMoreError.value = null;
    try {
      await fetchNextPage();
    } catch (err) {
      if (_searchId === searchId) loadMoreError.value = (err as Error).message;
    } finally {
      if (_searchId === searchId) loadingMore.value = false;
    }
  }

  return {
    error,
    searchResult,
    groupedResults,
    search,
    hasMore,
    loadingMore,
    loadMoreError,
    loadMore,
  };
}
