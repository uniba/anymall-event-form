import { SlotApplicationStatus, type Gender, type Prefecture, SlotState } from "@prisma/client";

export type SeedVenue = {
  id: string;
  name: string;
  address?: string;
};

export type SeedSlot = {
  id: string;
  venueId: SeedVenue["id"];
  eventName: string;
  theme: string;
  instructor: string;
  capacity: number;
  applicationBegin: string;
  applicationDeadline: string;
  lotteryResultTime: string;
  startsAt: string;
  endsAt: string;
  state: SlotState;
};

export type SeedSubmission = {
  id: string;
  name: string;
  furigana: string;
  email: string;
  gender?: Gender;
  birthday?: string;
  prefecture?: Prefecture;
  memo?: string;
};

export type SeedSubmissionSlot = {
  id: string;
  submissionId: SeedSubmission["id"];
  slotId: SeedSlot["id"];
  submissionAttemptId: string;
  status?: SlotApplicationStatus;
  appliedAt?: string;
  receiptEmailSentAt?: string;
  notes?: string;
};

export const seedVenues: SeedVenue[] = [
  {
    id: "seed-venue-tokyo-inumo",
    name: "inumo 芝公園 by ヴィラフォンテーヌ",
    address: "〒105-0011 東京都港区芝公園1-6-6",
  },
  {
    id: "seed-venue-osaka-dyplus",
    name: "Dyplus 大阪北",
    address: "〒530-0042 大阪府大阪市北区天満橋3-4-25",
  },
];

export const seedSlots: SeedSlot[] = [
  {
    id: "seed-slot-tokyo-inumo-may-16",
    venueId: "seed-venue-tokyo-inumo",
    eventName: "はじめての愛犬ごはんサロン",
    theme:
      "・初めての手作りトッピングごはん（試食あり）\n・QAタイム\n・飼い主さん同士の交流会（名刺交換など）\n・記念コンテンツ（簡易なワークショップ）",
    instructor: "今井まなみ",
    capacity: 20,
    applicationBegin: "2026-03-19T00:00:00+09:00",
    applicationDeadline: "2026-04-24T00:00:00+09:00",
    lotteryResultTime: "2026-04-30T12:00:00+09:00",
    startsAt: "2026-05-16T12:00:00+09:00",
    endsAt: "2026-05-16T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS,
  },
  {
    id: "seed-slot-osaka-dyplus-may-17",
    venueId: "seed-venue-tokyo-inumo",
    eventName: "はじめての愛犬ごはんサロン",
    theme:
      "・初めての手作りトッピングごはん（試食あり）\n・QAタイム\n・飼い主さん同士の交流会（名刺交換など）\n・記念コンテンツ（簡易なワークショップ）",
    instructor: "今井まなみ",
    capacity: 20,
    applicationBegin: "2026-03-19T00:00:00+09:00",
    applicationDeadline: "2026-04-24T00:00:00+09:00",
    lotteryResultTime: "2026-04-30T12:00:00+09:00",
    startsAt: "2026-05-17T12:00:00+09:00",
    endsAt: "2026-05-17T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS,
  },
  {
    id: "seed-slot-tokyo-inumo-may-27",
    venueId: "seed-venue-tokyo-inumo",
    eventName: "はじめての愛犬ごはんサロン",
    theme:
      "・初めての手作りトッピングごはん（試食あり）\n・QAタイム\n・飼い主さん同士の交流会（名刺交換など）\n・記念コンテンツ（簡易なワークショップ）",
    instructor: "今井まなみ",
    capacity: 20,
    applicationBegin: "2026-03-19T00:00:00+09:00",
    applicationDeadline: "2026-04-24T00:00:00+09:00",
    lotteryResultTime: "2026-04-30T12:00:00+09:00",
    startsAt: "2026-05-27T12:00:00+09:00",
    endsAt: "2026-05-27T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS,
  },
  {
    id: "seed-slot-tokyo-inumo-may-28",
    venueId: "seed-venue-osaka-dyplus",
    eventName: "愛犬ピクニック交流会",
    theme:
      "・ピクニック交流撮影会\n・例）しつけ相談（A'alda内の専門家）、写真撮影\n・飼い主さん同士の交流会（名刺交換など）\n・記念コンテンツ（簡易なワークショップ）",
    instructor: "AnyMallスタッフ",
    capacity: 20,
    applicationBegin: "2026-03-19T00:00:00+09:00",
    applicationDeadline: "2026-04-24T00:00:00+09:00",
    lotteryResultTime: "2026-04-30T12:00:00+09:00",
    startsAt: "2026-05-28T12:00:00+09:00",
    endsAt: "2026-05-28T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS,
  },
  {
    id: "seed-slot-tokyo-inumo-jun-13",
    venueId: "seed-venue-tokyo-inumo",
    eventName: "皮膚ケアごはんサロン",
    theme:
      "・夏前に！手作り皮膚ケアごはん（試食あり）\n・QAタイム\n・飼い主さん同士の交流会（名刺交換など）\n・記念コンテンツ（簡易なワークショップ）",
    instructor: "今井まなみ",
    capacity: 20,
    applicationBegin: "2026-03-19T00:00:00+09:00",
    applicationDeadline: "2026-05-15T00:00:00+09:00",
    lotteryResultTime: "2026-05-21T12:00:00+09:00",
    startsAt: "2026-06-13T12:00:00+09:00",
    endsAt: "2026-06-13T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS,
  },
  {
    id: "seed-slot-tokyo-inumo-jun-14",
    venueId: "seed-venue-tokyo-inumo",
    eventName: "愛犬デンタルケアサロン",
    theme:
      "・愛犬のデンタルケアレッスン\n・QAタイム、歯ブラシ実演など\n・飼い主さん同士の交流会（名刺交換など）\n・記念コンテンツ（簡易なワークショップ）",
    instructor: "未定",
    capacity: 20,
    applicationBegin: "2026-03-19T00:00:00+09:00",
    applicationDeadline: "2026-05-15T00:00:00+09:00",
    lotteryResultTime: "2026-05-21T12:00:00+09:00",
    startsAt: "2026-06-14T12:00:00+09:00",
    endsAt: "2026-06-14T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS,
  },
  {
    id: "seed-slot-tokyo-inumo-jun-17",
    venueId: "seed-venue-tokyo-inumo",
    eventName: "皮膚ケアごはんサロン",
    theme:
      "・夏前に！手作り皮膚ケアごはん（試食あり）\n・QAタイム\n・飼い主さん同士の交流会（名刺交換など）\n・記念コンテンツ（簡易なワークショップ）",
    instructor: "今井まなみ",
    capacity: 20,
    applicationBegin: "2026-03-19T00:00:00+09:00",
    applicationDeadline: "2026-05-15T00:00:00+09:00",
    lotteryResultTime: "2026-05-21T12:00:00+09:00",
    startsAt: "2026-06-17T12:00:00+09:00",
    endsAt: "2026-06-17T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS,
  },
  {
    id: "seed-slot-osaka-dyplus-jun-18",
    venueId: "seed-venue-osaka-dyplus",
    eventName: "愛犬の健康チェックサロン",
    theme:
      "例：健診、中毒など\n・QAタイム\n・飼い主さん同士の交流会（名刺交換など）\n・記念コンテンツ（簡易なワークショップ）",
    instructor: "中村篤史",
    capacity: 20,
    applicationBegin: "2026-03-19T00:00:00+09:00",
    applicationDeadline: "2026-05-15T00:00:00+09:00",
    lotteryResultTime: "2026-05-21T12:00:00+09:00",
    startsAt: "2026-06-18T12:00:00+09:00",
    endsAt: "2026-06-18T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS,
  },
  {
    id: "seed-slot-tokyo-inumo-jul-11",
    venueId: "seed-venue-tokyo-inumo",
    eventName: "夏バテ対策ごはんサロン",
    theme:
      "・夏バテ対策！食事と水分ケア\n・QAタイム\n・飼い主さん同士の交流会（名刺交換など）\n・記念コンテンツ（簡易なワークショップ）",
    instructor: "今井まなみ",
    capacity: 20,
    applicationBegin: "2026-03-19T00:00:00+09:00",
    applicationDeadline: "2026-06-12T00:00:00+09:00",
    lotteryResultTime: "2026-06-18T12:00:00+09:00",
    startsAt: "2026-07-11T12:00:00+09:00",
    endsAt: "2026-07-11T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS,
  },
  {
    id: "seed-slot-tokyo-inumo-jul-12",
    venueId: "seed-venue-tokyo-inumo",
    eventName: "夏の健康管理サロン",
    theme:
      "例：熱中症対策など\n・QAタイム\n・飼い主さん同士の交流会（名刺交換など）\n・記念コンテンツ（簡易なワークショップ）",
    instructor: "中村篤史",
    capacity: 20,
    applicationBegin: "2026-03-19T00:00:00+09:00",
    applicationDeadline: "2026-06-12T00:00:00+09:00",
    lotteryResultTime: "2026-06-18T12:00:00+09:00",
    startsAt: "2026-07-12T12:00:00+09:00",
    endsAt: "2026-07-12T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS,
  },
  {
    id: "seed-slot-tokyo-inumo-jul-15",
    venueId: "seed-venue-tokyo-inumo",
    eventName: "夏バテ対策ごはんサロン",
    theme:
      "・夏バテ対策！食事と水分ケア\n・QAタイム\n・飼い主さん同士の交流会（名刺交換など）\n・記念コンテンツ（簡易なワークショップ）",
    instructor: "今井まなみ",
    capacity: 20,
    applicationBegin: "2026-03-19T00:00:00+09:00",
    applicationDeadline: "2026-06-12T00:00:00+09:00",
    lotteryResultTime: "2026-06-18T12:00:00+09:00",
    startsAt: "2026-07-15T12:00:00+09:00",
    endsAt: "2026-07-15T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS,
  },
  {
    id: "seed-slot-osaka-dyplus-jul-16",
    venueId: "seed-venue-osaka-dyplus",
    eventName: "夏まつり交流会",
    theme:
      "・夏祭り交流撮影会\n・例）しつけ相談（A'alda内の専門家）、写真撮影\n・飼い主さん同士の交流会（名刺交換など）\n・記念コンテンツ（簡易なワークショップ）",
    instructor: "AnyMallスタッフ",
    capacity: 20,
    applicationBegin: "2026-03-19T00:00:00+09:00",
    applicationDeadline: "2026-06-12T00:00:00+09:00",
    lotteryResultTime: "2026-06-18T12:00:00+09:00",
    startsAt: "2026-07-16T12:00:00+09:00",
    endsAt: "2026-07-16T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS,
  },
];

const lotteryTargetSlotId = seedSlots[0]!.id;

export const seedSubmissions: SeedSubmission[] = Array.from({ length: 20 }, (_, index) => {
  const number = index + 1;
  const paddedNumber = String(number).padStart(2, "0");

  return {
    id: `seed-submission-lottery-${paddedNumber}`,
    name: `Lottery Applicant ${paddedNumber}`,
    furigana: `lottery applicant ${paddedNumber}`,
    email: `lottery-applicant-${paddedNumber}@example.com`,
    memo: "Lottery seed submission"
  };
});

export const seedSubmissionSlots: SeedSubmissionSlot[] = seedSubmissions.map((submission, index) => {
  const paddedNumber = String(index + 1).padStart(2, "0");

  return {
    id: `seed-submission-slot-lottery-${paddedNumber}`,
    submissionId: submission.id,
    slotId: lotteryTargetSlotId,
    submissionAttemptId: `seed-attempt-lottery-${paddedNumber}`,
    status: SlotApplicationStatus.APPLIED,
    appliedAt: "2026-03-20T12:00:00+09:00",
    receiptEmailSentAt: "2026-03-20T12:05:00+09:00"
  };
});
