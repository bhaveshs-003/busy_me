// ---------------------------------------------------------------------------
// Persistence helpers — thin wrappers around localStorage
// ---------------------------------------------------------------------------

const NAMESPACE = 'busyme_';

/**
 * Loads a value from localStorage.
 * Falls back to defaultValue if the key is absent or the stored JSON is invalid.
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(NAMESPACE + key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Serialises value to JSON and stores it under the namespaced key.
 */
export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(NAMESPACE + key, JSON.stringify(value));
  } catch {
    // Storage may be full or disabled — fail silently.
  }
}

/**
 * Removes a single namespaced key from localStorage.
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(NAMESPACE + key);
  } catch {
    // ignore
  }
}

/**
 * Removes ALL keys that start with the busyme_ namespace.
 */
export function clearStorage(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(NAMESPACE)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/**
 * Clears all busyme_ keys from localStorage and triggers a full page reload
 * so that all stores re-initialise with fresh demo data.
 */
export function resetDemoData(): void {
  clearStorage();
  window.location.reload();
}
