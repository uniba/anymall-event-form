import { Resend } from "resend";

type SendVerificationEmailInput = {
  to: string;
  token: string;
  baseUrl: string;
};

export async function sendVerificationEmail({
  to,
  token,
  baseUrl
}: SendVerificationEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  if (!from) {
    throw new Error("EMAIL_FROM is missing.");
  }

  const resend = new Resend(apiKey);
  const verifyUrl = `${baseUrl}/api/verify?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from,
    to,
    subject: "Verify your lunch event application",
    text: `Click this link to verify your application: ${verifyUrl}`,
    html: `
      <p>Thanks for applying to the lunch event.</p>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verifyUrl}">Verify my application</a></p>
      <p>This link expires in 24 hours.</p>
    `
  });
}

