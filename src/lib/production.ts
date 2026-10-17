/**
 * Production mode utilities — fail closed when live.
 * 
 * In production (NODE_ENV=production AND not in test mode):
 * - API calls must NOT silently fall back to mock data
 * - If an external API is down, return an error — don't fabricate valuations
 * - A "TEST MODE" banner shows on all pages
 * 
 * In development:
 * - Mock fallbacks are fine for testing the flow
 */

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const TEST_MODE = process.env.PAWNPASS_TEST_MODE === "true";

/**
 * Returns true if we're in production AND not in test mode.
 * When true, APIs should error rather than mock.
 */
export function isLiveMode(): boolean {
  return IS_PRODUCTION && !TEST_MODE;
}

/**
 * Returns true if mock fallbacks are allowed (dev or test mode).
 */
export function allowMockFallback(): boolean {
  return !isLiveMode();
}

/**
 * Throws in production. Returns the mock value in dev/test.
 * Use at fallback points: `return failClosed(mockValue, "Perplexity unavailable")`
 */
export function failClosed<T>(mockValue: T, errorMessage: string): T {
  if (isLiveMode()) {
    throw new Error(errorMessage);
  }
  return mockValue;
}

/**
 * Returns true if the test mode banner should be visible.
 */
export function showTestModeBanner(): boolean {
  return TEST_MODE || (!IS_PRODUCTION);
}
