require('dotenv').config();
const nodemailer = require('nodemailer');

function sendMail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // Gmail SMTP 587 = false

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const senderName = process.env.EMAIL_NAME || "LabHub Support";

  const mailOptions = {
    from: `"${senderName}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = sendMail;
