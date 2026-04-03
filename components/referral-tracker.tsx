"use client";

import { useEffect } from "react";
import { captureReferralFromURL } from "@/lib/referral-tracking";

/**
 * Client component that captures referral source from URL on mount.
 * Included in the root layout to capture referrals on any page entry.
 */
export function ReferralTracker() {
  useEffect(() => {
    captureReferralFromURL();
  }, []);

  return null;
}
