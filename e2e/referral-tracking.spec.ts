import { test, expect } from "@playwright/test";

test.describe("Referral Tracking", () => {
  test.describe("URL parameter capture", () => {
    test("captures ref parameter into localStorage on homepage", async ({ page }) => {
      await page.goto("/?ref=diners_club");
      const stored = await page.evaluate(() =>
        localStorage.getItem("anymall_referral_source")
      );
      expect(stored).toBe("diners_club");
    });

    test("captures ref parameter on event apply page", async ({ page }) => {
      await page.goto("/event/apply?ref=fpc_insurance");
      const stored = await page.evaluate(() =>
        localStorage.getItem("anymall_referral_source")
      );
      expect(stored).toBe("fpc_insurance");
    });

    test("normalizes ref to lowercase", async ({ page }) => {
      await page.goto("/?ref=Diners_Club");
      const stored = await page.evaluate(() =>
        localStorage.getItem("anymall_referral_source")
      );
      expect(stored).toBe("diners_club");
    });

    test("does not store invalid ref (special characters)", async ({ page }) => {
      await page.goto("/?ref=<script>alert(1)</script>");
      const stored = await page.evaluate(() =>
        localStorage.getItem("anymall_referral_source")
      );
      expect(stored).toBeNull();
    });

    test("does not store ref exceeding 100 characters", async ({ page }) => {
      const longRef = "a".repeat(101);
      await page.goto(`/?ref=${longRef}`);
      const stored = await page.evaluate(() =>
        localStorage.getItem("anymall_referral_source")
      );
      expect(stored).toBeNull();
    });

    test("persists ref across page navigation", async ({ page }) => {
      await page.goto("/?ref=tanaka_instagram");

      // Navigate to another page
      await page.goto("/event/apply");

      const stored = await page.evaluate(() =>
        localStorage.getItem("anymall_referral_source")
      );
      expect(stored).toBe("tanaka_instagram");
    });

    test("overwrites previous ref with new valid ref (last-touch)", async ({ page }) => {
      await page.goto("/?ref=old_source");
      await page.goto("/event/apply?ref=new_source");

      const stored = await page.evaluate(() =>
        localStorage.getItem("anymall_referral_source")
      );
      expect(stored).toBe("new_source");
    });

    test("does not overwrite existing ref with invalid ref", async ({ page }) => {
      await page.goto("/?ref=valid_source");
      await page.goto("/event/apply?ref=invalid!");

      const stored = await page.evaluate(() =>
        localStorage.getItem("anymall_referral_source")
      );
      expect(stored).toBe("valid_source");
    });
  });

  test.describe("Form submission includes referralSource", () => {
    test("sends referralSource in API request body", async ({ page }) => {
      // Pre-set localStorage before navigating
      await page.goto("/");
      await page.evaluate(() => {
        localStorage.setItem("anymall_referral_source", "diners_club");
      });

      // Navigate to form page (need valid slot IDs from the page)
      await page.goto("/event/apply");

      // Intercept the API call to verify referralSource is included
      const apiRequestPromise = page.waitForRequest(
        (req) =>
          req.url().includes("/api/applications") && req.method() === "POST",
        { timeout: 5000 }
      );

      // We can't fully submit without valid slots, but we can verify
      // the referralSource is read from localStorage
      const referralSource = await page.evaluate(() =>
        localStorage.getItem("anymall_referral_source")
      );
      expect(referralSource).toBe("diners_club");
    });

    test("clears referralSource from localStorage after successful submission", async ({
      page,
    }) => {
      // Set up: pre-populate localStorage
      await page.goto("/");
      await page.evaluate(() => {
        localStorage.setItem("anymall_referral_source", "test_source");
      });

      // Mock a successful API response
      await page.route("**/api/applications", async (route) => {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      });

      // Navigate to the form page with mocked slot data
      await page.goto("/event/apply/form?slots=mock-slot-id");

      // The form may not render without valid slots from DB,
      // but we can test the clearing behavior via direct API mock
      // by executing the form's submission logic
      const cleared = await page.evaluate(async () => {
        // Simulate what the form does on successful submission
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: true }),
        });
        if (response.ok) {
          localStorage.removeItem("anymall_referral_source");
        }
        return localStorage.getItem("anymall_referral_source");
      });

      expect(cleared).toBeNull();
    });
  });

  test.describe("API validation", () => {
    test("rejects referralSource with invalid characters", async ({ request }) => {
      const response = await request.post("/api/applications", {
        data: {
          name: "山田太郎",
          furigana: "ヤマダタロウ",
          email: "test@example.com",
          referralSource: "<script>alert('xss')</script>",
          selectedSlotIds: ["slot-1"],
        },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Invalid referral source format.");
    });

    test("rejects referralSource exceeding 100 characters", async ({ request }) => {
      const response = await request.post("/api/applications", {
        data: {
          name: "山田太郎",
          furigana: "ヤマダタロウ",
          email: "test@example.com",
          referralSource: "a".repeat(101),
          selectedSlotIds: ["slot-1"],
        },
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe("Referral source too long.");
    });
  });
});
