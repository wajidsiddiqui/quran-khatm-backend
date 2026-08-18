import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

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