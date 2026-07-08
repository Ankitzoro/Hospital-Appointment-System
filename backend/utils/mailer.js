const nodemailer = require('nodemailer');

const createTransporter = () => {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error('Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment variables.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    connectionTimeout: 60000,
    greetingTimeout: 60000,
    socketTimeout: 60000,
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
};

const sendVerificationOtpEmail = async ({ to, name, otp }) => {
  const transporter = createTransporter();
  const fromName = process.env.EMAIL_FROM_NAME || 'Hospital App';
  const mailFrom = process.env.EMAIL_FROM || process.env.GMAIL_USER;

  await transporter.sendMail({
    from: `"${fromName}" <${mailFrom}>`,
    to,
    subject: 'Your verification code',
    text: `Hi ${name || 'there'}, your verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Email verification</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Your verification code is:</p>
        <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 16px 0;">${otp}</div>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
};

module.exports = {
  sendVerificationOtpEmail,
};
