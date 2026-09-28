import { afterEach, describe, expect, it, vi } from "vitest";
import { preventQueueCreation } from "@/web/price-check/trade/common";
import { RateLimiter } from "@/web/price-check/trade/RateLimiter";

afterEach(() => {
  vi.useRealTimers();
});

describe("trade rate-limit preflight", () => {
  it("waits for a short occupied limit instead of showing a retry error", async () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter(1, 2);
    await limiter.wait();

    expect(() =>
      preventQueueCreation([{ count: 1, limiters: [limiter] }]),
    ).not.toThrow();

    const nextRequest = RateLimiter.waitMulti([limiter]);
    await vi.advanceTimersByTimeAsync(1999);
    expect(limiter.queue.value).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await nextRequest;
    expect(limiter.queue.value).toBe(0);
  });

  it("still rejects a long predicted wait", async () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter(1, 60);
    await limiter.wait();

    expect(() =>
      preventQueueCreation([{ count: 1, limiters: [limiter] }]),
    ).toThrow("Retry after 60 seconds");
  });
});
