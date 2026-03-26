const REFERRAL_SOURCE_KEY = "anymall_referral_source";
const MAX_REF_LENGTH = 100;
const VALID_REF_PATTERN = /^[a-zA-Z0-9_-]+$/;

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
 * Validate and sanitize referral source value
 */
function isValidReferralSource(value: string): boolean {
  // Check length
  if (value.length === 0 || value.length > MAX_REF_LENGTH) {
    return false;
  }

  // Check for valid characters (alphanumeric, underscore, hyphen only)
  if (!VALID_REF_PATTERN.test(value)) {
    return false;
  }

  return true;
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
    const sanitized = ref.trim().toLowerCase();

    // Validate the referral source
    if (!isValidReferralSource(sanitized)) {
      console.warn('Invalid referral source:', ref);
      return;
    }

    setReferralSource(sanitized);
  }
}
