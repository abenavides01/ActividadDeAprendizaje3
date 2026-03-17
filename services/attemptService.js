const pool = require("../db/connection");

const MAX_ATTEMPTS = 3;
const BLOCK_MINUTES = 2;

async function getAttemptByEmail(email) {
  const result = await pool.query(
    "SELECT * FROM login_attempts WHERE email = $1",
    [email]
  );

  return result.rows[0];
}

function isBlocked(attempt) {
  return attempt && attempt.blocked_until && new Date(attempt.blocked_until) > new Date();
}

async function registerFailedAttempt(email, attempt) {
  if (!attempt) {
    await pool.query(
      "INSERT INTO login_attempts (email, failed_attempts, blocked_until) VALUES ($1, $2, $3)",
      [email, 1, null]
    );
    return;
  }

  const newAttempts = attempt.failed_attempts + 1;
  const blockedUntil =
    newAttempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + BLOCK_MINUTES * 60 * 1000)
      : null;

  await pool.query(
    "UPDATE login_attempts SET failed_attempts = $1, blocked_until = $2 WHERE email = $3",
    [newAttempts, blockedUntil, email]
  );
}

async function clearAttempts(email) {
  await pool.query(
    "DELETE FROM login_attempts WHERE email = $1",
    [email]
  );
}

module.exports = {
  getAttemptByEmail,
  isBlocked,
  registerFailedAttempt,
  clearAttempts
};