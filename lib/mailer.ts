import sgMail, { type MailDataRequired } from "@sendgrid/mail";

export type SlotInfo = {
  venueName: string;
  eventName: string;
  startsAt: Date;
  endsAt: Date;
};

type SendApplicationReceivedEmailInput = {
  to: string;
  applicantName: string;
  slots: SlotInfo[];
};

export function formatSlotDate(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo"
  });
}

export function buildSlotListText(slots: SlotInfo[]): string {
  return slots
    .map((slot) => {
      return `　- ${formatSlotDate(slot.startsAt)} ${slot.venueName}`;
    })
    .join("\n");
}

export function buildSlotListHtml(slots: SlotInfo[]): string {
  return slots
    .map((slot) => {
      return `<li>${formatSlotDate(slot.startsAt)} ${slot.venueName}</li>`;
    })
    .join("\n");
}

export async function sendApplicationReceivedEmail({
  to,
  applicantName,
  slots
}: SendApplicationReceivedEmailInput): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY is missing.");
  }

  if (!from) {
    throw new Error("EMAIL_FROM is missing.");
  }

  sgMail.setApiKey(apiKey);

  const fromMatch = from.match(/^(.+?)\s*<([^>]+)>$/);
  const fromField: MailDataRequired["from"] = fromMatch
    ? {
        name: fromMatch[1].trim(),
        email: fromMatch[2].trim()
      }
    : from;

  const slotListText = buildSlotListText(slots);
  const slotListHtml = buildSlotListHtml(slots);

  const textBody = `${applicantName} 様

このたびは、AnyMallイベントにご応募いただきありがとうございます。
以下の内容で応募を受け付けました。

【応募内容】
・氏名：${applicantName}
・申し込みイベント：
${slotListText}

本イベントは応募多数の場合、抽選とさせていただきます。
抽選結果につきましては、後日メールにてご案内いたします。
なお、応募状況や内容確認のため、事務局よりご連絡を差し上げる場合がございます。

応募内容の変更・キャンセル、またはご不明点がございましたら、
本メールへの返信またはお問い合わせ窓口までご連絡ください。

どうぞよろしくお願いいたします。

――――――――――
AnyMall イベント事務局
<いんふぉ@anymall.jp>
URL: https://event.anymall.jp
――――――――――
`;

  const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.8;">
      <p>${applicantName} 様</p>

      <p>このたびは、AnyMallイベントにご応募いただきありがとうございます。<br>
      以下の内容で応募を受け付けました。</p>

      <div style="background-color: #f9f9f9; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0;"><strong>【応募内容】</strong></p>
        <p style="margin: 0 0 8px 0;">・氏名：${applicantName}</p>
        <p style="margin: 0 0 4px 0;">・申し込みイベント：</p>
        <ul style="margin: 0; padding-left: 24px;">
          ${slotListHtml}
        </ul>
      </div>

      <p>本イベントは応募多数の場合、抽選とさせていただきます。<br>
      抽選結果につきましては、後日メールにてご案内いたします。<br>
      なお、応募状況や内容確認のため、事務局よりご連絡を差し上げる場合がございます。</p>

      <p>応募内容の変更・キャンセル、またはご不明点がございましたら、<br>
      本メールへの返信またはお問い合わせ窓口までご連絡ください。</p>

      <p>どうぞよろしくお願いいたします。</p>

      <hr style="border: none; border-top: 1px solid #ccc; margin: 24px 0;">
      <p style="font-size: 14px; color: #666; margin: 0;">
        AnyMall イベント事務局<br>
        &lt;info@anymall.jp&gt;<br>
        URL: <a href="https://event.anymall.jp">https://event.anymall.jp</a>
      </p>
    </div>
  `;

  const message: MailDataRequired = {
    from: fromField,
    to,
    subject: "【AnyMall】イベント参加申し込みありがとうございます",
    text: textBody,
    html: htmlBody
  };

  try {
    await sgMail.send(message);
  } catch (error) {
    const maybeResponse = error as { response?: { body?: unknown } };
    if (maybeResponse.response?.body) {
      console.error("SendGrid response body:", maybeResponse.response.body);
    }
    throw error;
  }
}
