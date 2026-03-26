"use client";

import { useEffect } from "react";
import { captureReferralFromURL } from "@/lib/referral-tracking";

/**
 * Client component that captures referral source from URL on mount
 * Should be included in the root layout or main pages
 */
export function ReferralTracker() {
  useEffect(() => {
    captureReferralFromURL();
  }, []);

  return null;
}
