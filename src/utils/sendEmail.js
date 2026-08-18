import { Resend } from "resend";

export const sendEmail = async ({ to, subject, html }) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  console.log(
    "RESEND_API_KEY exists:",
    !!process.env.RESEND_API_KEY
  );

  const { data, error } = await resend.emails.send({
    from: "Quran Khatm <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error(error.message || "Failed to send email");
  }

  console.log("Email sent successfully:", data);

  return data;
};