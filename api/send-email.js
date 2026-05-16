// api/send-email.js
// Temporary stub - will be implemented in Day 11

async function sendEmail(to, subject, body) {
  console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
  return { success: true };
}

module.exports = { sendEmail };