import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatSlotDate,
  buildSlotListText,
  buildSlotListHtml,
  sendApplicationReceivedEmail,
  type SlotInfo
} from "./mailer";

describe("formatSlotDate", () => {
  it("formats a date in Japanese format", () => {
    const date = new Date("2026-05-16T10:00:00+09:00");
    const result = formatSlotDate(date);
    expect(result).toBe("2026年5月16日");
  });

  it("handles different months correctly", () => {
    const date = new Date("2026-12-25T15:00:00+09:00");
    const result = formatSlotDate(date);
    expect(result).toBe("2026年12月25日");
  });
});

describe("buildSlotListText", () => {
  it("builds a text list of slots", () => {
    const slots: SlotInfo[] = [
      {
        venueName: "渋谷サロン",
        eventName: "猫のお預かり体験",
        startsAt: new Date("2026-05-16T10:00:00+09:00"),
        endsAt: new Date("2026-05-16T12:00:00+09:00")
      }
    ];
    const result = buildSlotListText(slots);
    expect(result).toBe("　- 2026年5月16日 渋谷サロン");
  });

  it("joins multiple slots with newlines", () => {
    const slots: SlotInfo[] = [
      {
        venueName: "渋谷サロン",
        eventName: "猫のお預かり体験",
        startsAt: new Date("2026-05-16T10:00:00+09:00"),
        endsAt: new Date("2026-05-16T12:00:00+09:00")
      },
      {
        venueName: "新宿サロン",
        eventName: "犬のお預かり体験",
        startsAt: new Date("2026-05-17T14:00:00+09:00"),
        endsAt: new Date("2026-05-17T16:00:00+09:00")
      }
    ];
    const result = buildSlotListText(slots);
    expect(result).toBe(
      "　- 2026年5月16日 渋谷サロン\n　- 2026年5月17日 新宿サロン"
    );
  });

  it("returns empty string for empty slots array", () => {
    const result = buildSlotListText([]);
    expect(result).toBe("");
  });
});

describe("buildSlotListHtml", () => {
  it("builds an HTML list of slots", () => {
    const slots: SlotInfo[] = [
      {
        venueName: "渋谷サロン",
        eventName: "猫のお預かり体験",
        startsAt: new Date("2026-05-16T10:00:00+09:00"),
        endsAt: new Date("2026-05-16T12:00:00+09:00")
      }
    ];
    const result = buildSlotListHtml(slots);
    expect(result).toBe("<li>2026年5月16日 渋谷サロン</li>");
  });

  it("joins multiple slots with newlines", () => {
    const slots: SlotInfo[] = [
      {
        venueName: "渋谷サロン",
        eventName: "猫のお預かり体験",
        startsAt: new Date("2026-05-16T10:00:00+09:00"),
        endsAt: new Date("2026-05-16T12:00:00+09:00")
      },
      {
        venueName: "新宿サロン",
        eventName: "犬のお預かり体験",
        startsAt: new Date("2026-05-17T14:00:00+09:00"),
        endsAt: new Date("2026-05-17T16:00:00+09:00")
      }
    ];
    const result = buildSlotListHtml(slots);
    expect(result).toBe(
      "<li>2026年5月16日 渋谷サロン</li>\n<li>2026年5月17日 新宿サロン</li>"
    );
  });
});

describe("sendApplicationReceivedEmail", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("throws error when SENDGRID_API_KEY is missing", async () => {
    delete process.env.SENDGRID_API_KEY;
    process.env.EMAIL_FROM = "test@example.com";

    await expect(
      sendApplicationReceivedEmail({
        to: "user@example.com",
        applicantName: "テスト太郎",
        slots: []
      })
    ).rejects.toThrow("SENDGRID_API_KEY is missing.");
  });

  it("throws error when EMAIL_FROM is missing", async () => {
    process.env.SENDGRID_API_KEY = "test-api-key";
    delete process.env.EMAIL_FROM;

    await expect(
      sendApplicationReceivedEmail({
        to: "user@example.com",
        applicantName: "テスト太郎",
        slots: []
      })
    ).rejects.toThrow("EMAIL_FROM is missing.");
  });
});
