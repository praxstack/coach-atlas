import { describe, expect, it, vi } from "vitest";
import { calculateBackoff, isRetryableError, withRetry } from "./retryUtils";

describe("retryUtils", () => {
  describe("calculateBackoff", () => {
    it("should increase delay exponentially", () => {
      const delay1 = calculateBackoff(0, {
        initialDelayMs: 100,
        backoffMultiplier: 2,
        maxDelayMs: 1000,
        retryableStatusCodes: [],
        maxRetries: 3
      });
      const delay2 = calculateBackoff(1, {
        initialDelayMs: 100,
        backoffMultiplier: 2,
        maxDelayMs: 1000,
        retryableStatusCodes: [],
        maxRetries: 3
      });

      // Allow for jitter
      expect(delay1).toBeGreaterThan(50); // ~100ms
      expect(delay2).toBeGreaterThan(150); // ~200ms
    });

    it("should cap delay at maxDelayMs", () => {
      const delay = calculateBackoff(10, {
        initialDelayMs: 100,
        backoffMultiplier: 2,
        maxDelayMs: 500, // Cap at 500ms
        retryableStatusCodes: [],
        maxRetries: 3
      });
      expect(delay).toBeLessThan(650); // 500ms + 20% jitter max
    });
  });

  describe("isRetryableError", () => {
    it("should return true for network errors", () => {
      const error = new TypeError("Failed to fetch");
      expect(isRetryableError(error)).toBe(true);
    });

    it("should return true for 429 rate limit", () => {
      const error = new Error("Request failed with status code 429");
      expect(isRetryableError(error)).toBe(true);
    });

    it("should return false for 401 unauthorized", () => {
      const error = new Error("Request failed with status code 401");
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe("withRetry", () => {
    it("should retry function until success", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValue("success");

      const result = await withRetry(fn, {
        maxRetries: 2,
        initialDelayMs: 1 // Fast for test
      });

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should fail after max retries", async () => {
      const fn = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(withRetry(fn, {
        maxRetries: 2,
        initialDelayMs: 1
      })).rejects.toThrow("Failed to fetch");

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
