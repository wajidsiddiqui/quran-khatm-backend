import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log("Sending email from:", emailUser);
  console.log("Email password exists:", !!emailPass);
  console.log("Email password length:", emailPass?.length);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,

    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  await transporter.sendMail({
    from: `"Quran Khatm" <${emailUser}>`,
    to,
    subject,
    html,
  });
};