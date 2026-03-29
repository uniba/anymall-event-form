// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import {
  getReferralSource,
  setReferralSource,
  clearReferralSource,
  captureReferralFromURL,
} from "./referral-tracking";

describe("referral-tracking", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getReferralSource", () => {
    it("returns null when no referral source is stored", () => {
      expect(getReferralSource()).toBeNull();
    });

    it("returns stored referral source", () => {
      localStorage.setItem("anymall_referral_source", "diners_club");
      expect(getReferralSource()).toBe("diners_club");
    });
  });

  describe("setReferralSource", () => {
    it("stores referral source in localStorage", () => {
      setReferralSource("fpc_insurance");
      expect(localStorage.getItem("anymall_referral_source")).toBe("fpc_insurance");
    });
  });

  describe("clearReferralSource", () => {
    it("removes referral source from localStorage", () => {
      localStorage.setItem("anymall_referral_source", "diners_club");
      clearReferralSource();
      expect(localStorage.getItem("anymall_referral_source")).toBeNull();
    });
  });

  describe("captureReferralFromURL", () => {
    function setURL(url: string) {
      Object.defineProperty(window, "location", {
        value: new URL(url),
        writable: true,
        configurable: true,
      });
    }

    it("captures ref parameter and stores in localStorage", () => {
      setURL("http://localhost/?ref=diners_club");
      captureReferralFromURL();
      expect(getReferralSource()).toBe("diners_club");
    });

    it("normalizes to lowercase", () => {
      setURL("http://localhost/?ref=Diners_Club");
      captureReferralFromURL();
      expect(getReferralSource()).toBe("diners_club");
    });

    it("does nothing when no ref parameter", () => {
      setURL("http://localhost/");
      captureReferralFromURL();
      expect(getReferralSource()).toBeNull();
    });

    it("does nothing when ref is empty", () => {
      setURL("http://localhost/?ref=");
      captureReferralFromURL();
      expect(getReferralSource()).toBeNull();
    });

    it("does nothing when ref is whitespace only", () => {
      setURL("http://localhost/?ref=%20%20");
      captureReferralFromURL();
      expect(getReferralSource()).toBeNull();
    });

    it("rejects ref with special characters", () => {
      setURL("http://localhost/?ref=<script>alert('xss')</script>");
      captureReferralFromURL();
      expect(getReferralSource()).toBeNull();
    });

    it("rejects ref with SQL injection attempt", () => {
      setURL("http://localhost/?ref=';DROP TABLE submissions;--");
      captureReferralFromURL();
      expect(getReferralSource()).toBeNull();
    });

    it("rejects ref with Japanese characters", () => {
      setURL("http://localhost/?ref=あいうえお");
      captureReferralFromURL();
      expect(getReferralSource()).toBeNull();
    });

    it("rejects ref exceeding 100 characters", () => {
      const longRef = "a".repeat(101);
      setURL(`http://localhost/?ref=${longRef}`);
      captureReferralFromURL();
      expect(getReferralSource()).toBeNull();
    });

    it("accepts ref at exactly 100 characters", () => {
      const maxRef = "a".repeat(100);
      setURL(`http://localhost/?ref=${maxRef}`);
      captureReferralFromURL();
      expect(getReferralSource()).toBe(maxRef);
    });

    it("accepts alphanumeric with underscore and hyphen", () => {
      setURL("http://localhost/?ref=tanaka-instagram_2026");
      captureReferralFromURL();
      expect(getReferralSource()).toBe("tanaka-instagram_2026");
    });

    it("does not overwrite existing source when new ref is invalid", () => {
      setReferralSource("existing_source");
      setURL("http://localhost/?ref=<invalid>");
      captureReferralFromURL();
      expect(getReferralSource()).toBe("existing_source");
    });

    it("overwrites existing source when new ref is valid (last-touch attribution)", () => {
      setReferralSource("old_source");
      setURL("http://localhost/?ref=new_source");
      captureReferralFromURL();
      expect(getReferralSource()).toBe("new_source");
    });
  });
});
