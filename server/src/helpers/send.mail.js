require('dotenv').config();
const nodemailer = require('nodemailer');

function sendMail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'false',

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: 'Student Management ',
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = sendMail;
