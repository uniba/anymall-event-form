import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    slot: {
      findMany: vi.fn(),
    },
    submission: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    submissionSlot: {
      createMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

// Mock mailer
vi.mock("@/lib/mailer", () => ({
  sendApplicationReceivedEmail: vi.fn(),
}));

describe("POST /api/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Validation", () => {
    it("should reject when name is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          furigana: "ヤマダタロウ",
          email: "test@example.com",
          selectedSlotIds: ["slot-1"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Name is required.");
    });

    it("should reject when furigana is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "山田太郎",
          email: "test@example.com",
          selectedSlotIds: ["slot-1"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Furigana must use katakana only.");
    });

    it("should reject when furigana is not katakana", async () => {
      const request = new NextRequest("http://localhost:3000/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "山田太郎",
          furigana: "yamada taro",
          email: "test@example.com",
          selectedSlotIds: ["slot-1"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Furigana must use katakana only.");
    });

    it("should reject when email is invalid", async () => {
      const request = new NextRequest("http://localhost:3000/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "山田太郎",
          furigana: "ヤマダタロウ",
          email: "invalid-email",
          selectedSlotIds: ["slot-1"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid email format.");
    });

    it("should accept valid katakana with spaces and middle dots", async () => {
      const { prisma } = await import("@/lib/prisma");
      const { sendApplicationReceivedEmail } = await import("@/lib/mailer");

      vi.mocked(prisma.slot.findMany).mockResolvedValue([{ id: "slot-1" }] as any);
      vi.mocked(prisma.submission.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.submission.create).mockResolvedValue({
        id: "sub-1",
        name: "山田 太郎",
        furigana: "ヤマダ タロウ",
        email: "test@example.com",
      } as any);
      vi.mocked(sendApplicationReceivedEmail).mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost:3000/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "山田 太郎",
          furigana: "ヤマダ タロウ",
          email: "test@example.com",
          selectedSlotIds: ["slot-1"],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe("Data Storage", () => {
    it("should store both name and furigana in database", async () => {
      const { prisma } = await import("@/lib/prisma");
      const { sendApplicationReceivedEmail } = await import("@/lib/mailer");

      vi.mocked(prisma.slot.findMany).mockResolvedValue([{ id: "slot-1" }] as any);
      vi.mocked(prisma.submission.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.submission.create).mockResolvedValue({
        id: "sub-1",
        name: "山田太郎",
        furigana: "ヤマダタロウ",
        email: "test@example.com",
      } as any);
      vi.mocked(sendApplicationReceivedEmail).mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost:3000/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "山田太郎",
          furigana: "ヤマダタロウ",
          email: "test@example.com",
          gender: "male",
          birthday: "1990-01-01",
          prefecture: "東京都",
          memo: "柴犬、5歳",
          selectedSlotIds: ["slot-1"],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(prisma.submission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "山田太郎",
          furigana: "ヤマダタロウ",
          email: "test@example.com",
          gender: "MALE",
          birthday: new Date("1990-01-01T00:00:00.000Z"),
          prefecture: "東京都",
          memo: "柴犬、5歳",
        }),
      });
    });

    it("should store all optional fields when provided", async () => {
      const { prisma } = await import("@/lib/prisma");
      const { sendApplicationReceivedEmail } = await import("@/lib/mailer");

      vi.mocked(prisma.slot.findMany).mockResolvedValue([{ id: "slot-1" }] as any);
      vi.mocked(prisma.submission.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.submission.create).mockResolvedValue({
        id: "sub-1",
        name: "山田太郎",
        furigana: "ヤマダタロウ",
        email: "test@example.com",
        gender: "MALE",
        birthday: new Date("1990-01-01"),
        prefecture: "東京都",
        memo: "柴犬、5歳、皮膚が弱い",
      } as any);
      vi.mocked(sendApplicationReceivedEmail).mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost:3000/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "山田太郎",
          furigana: "ヤマダタロウ",
          email: "test@example.com",
          gender: "male",
          birthday: "1990-01-01",
          prefecture: "東京都",
          memo: "柴犬、5歳、皮膚が弱い",
          selectedSlotIds: ["slot-1"],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(prisma.submission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "山田太郎",
          furigana: "ヤマダタロウ",
          email: "test@example.com",
          gender: "MALE",
          birthday: new Date("1990-01-01T00:00:00.000Z"),
          prefecture: "東京都",
          memo: "柴犬、5歳、皮膚が弱い",
        }),
      });
    });
  });
});
