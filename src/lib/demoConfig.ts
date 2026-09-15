// ---------------------------------------------------------------------------
// Demo / development configuration for Busy.me
// ---------------------------------------------------------------------------

export interface DemoConfig {
  /** Whether to simulate network latency on all mock API calls. */
  simulateLatency: boolean;
  /** Base latency in milliseconds when simulateLatency is true. */
  latencyMs: number;
  /** If true, random API errors may be thrown at `errorRate` frequency. */
  simulateErrors: boolean;
  /** Probability (0–1) that a call fails while `simulateErrors` is true. */
  errorRate: number;
  /** If true, all API calls resolve immediately with empty data. */
  offlineMode: boolean;
}

/**
 * Mutable at runtime — the Demo Control Panel writes through to this object so
 * latency, failures and offline mode can be flipped mid-demo.
 */
export const DEMO_CONFIG: DemoConfig = {
  simulateLatency: true,
  latencyMs: 600,
  simulateErrors: false,
  errorRate: 0.1,
  offlineMode: false,
};

/**
 * Returns the configured latency in ms.
 * Returns 0 when latency simulation is disabled.
 * In offline mode the delay is also skipped.
 */
export function getDemoDelay(): number {
  if (DEMO_CONFIG.offlineMode) return 0;
  if (!DEMO_CONFIG.simulateLatency) return 0;
  return DEMO_CONFIG.latencyMs;
}

/**
 * Returns true when an API call should randomly fail.
 * Only active when simulateErrors is enabled.
 */
export function shouldSimulateError(): boolean {
  if (!DEMO_CONFIG.simulateErrors) return false;
  return Math.random() < DEMO_CONFIG.errorRate;
}
