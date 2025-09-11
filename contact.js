const nodemailer = require('nodemailer');

// Basic in-memory rate limiter (per-process, best-effort)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 per minute per IP
const ipHits = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const entry = ipHits.get(ip) || { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + RATE_LIMIT_WINDOW_MS;
  }
  entry.count += 1;
  ipHits.set(ip, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

function sanitize(str) {
  return String(str || '').replace(/[\r\n]/g, ' ').trim();
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
  }

  const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  if (!rateLimit(ip)) {
    return { statusCode: 429, body: JSON.stringify({ success: false, message: 'Too many requests. Please try again later.' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid JSON' }) };
  }

  const name = sanitize(data.name);
  const email = sanitize(data.email);
  const phone = sanitize(data.phone);
  const subject = sanitize(data.subject);
  const message = sanitize(data.message);
  const timestamp = sanitize(data.timestamp);

  if (!name || !email || !subject || !message) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Missing required fields.' }) };
  }
  if (!isEmailValid(email)) {
    return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid email.' }) };
  }

  // Optional: reCAPTCHA verification
  const recaptchaToken = sanitize(data.recaptchaToken);
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
  if (recaptchaSecret && recaptchaToken) {
    try {
      const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: recaptchaSecret, response: recaptchaToken })
      });
      const verifyJson = await verifyRes.json();
      if (!verifyJson.success) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'reCAPTCHA failed.' }) };
      }
    } catch (e) {
      console.error('reCAPTCHA error', e);
    }
  }

  const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;
  if (!RECIPIENT_EMAIL) {
    console.error('Missing RECIPIENT_EMAIL env var');
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Server misconfiguration.' }) };
  }

  // Configure Nodemailer transport via SMTP
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('Missing SMTP configuration');
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Email service not configured.' }) };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  });

  const mailSubject = `Portfolio Contact Form — ${name}`;
  const mailText = [
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    `Subject: ${subject}`,
    `Message: ${message}`,
    `Time: ${timestamp}`,
    ''
  ].filter(Boolean).join('\n');

  try {
    await transporter.sendMail({
      from: `Portfolio Contact <${smtpUser}>`,
      to: RECIPIENT_EMAIL,
      replyTo: email,
      subject: mailSubject,
      text: mailText
    });
    return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Message sent successfully' }) };
  } catch (e) {
    console.error('Mail send error', e);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Failed to send message' }) };
  }
};
