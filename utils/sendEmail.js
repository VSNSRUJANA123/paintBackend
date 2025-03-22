const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or your SMTP service
    auth: {
      user: process.env.EMAIL_ADMIN,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"Your Company" <${process.env.EMAIL_ADMIN}>`,
    to,
    subject,
    html,
  });

  console.log("Email sent:", info.messageId);
};

module.exports = sendEmail;
