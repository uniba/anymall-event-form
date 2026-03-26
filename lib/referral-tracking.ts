const REFERRAL_SOURCE_KEY = "anymall_referral_source";

/**
 * Get the referral source from localStorage
 */
export function getReferralSource(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REFERRAL_SOURCE_KEY);
  } catch {
    return null;
  }
}

/**
 * Save the referral source to localStorage
 */
export function setReferralSource(source: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REFERRAL_SOURCE_KEY, source);
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Clear the referral source from localStorage
 */
export function clearReferralSource(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(REFERRAL_SOURCE_KEY);
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Capture referral source from URL query parameter
 * Should be called on the client side when the page loads
 */
export function captureReferralFromURL(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");

  if (ref && ref.trim()) {
    setReferralSource(ref.trim());
  }
}
