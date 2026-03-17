const pool = require("../db/connection");

const MAX_ATTEMPTS = 3;
const BLOCK_MINUTES = 2;

async function logAttempt(email, idUsuario, exitoso, observacion) {
  await pool.query(
    `INSERT INTO tblIntentoLogin (email_ingresado, idUsuario, exitoso, observacion)
     VALUES ($1, $2, $3, $4)`,
    [email, idUsuario, exitoso, observacion]
  );
}

function isBlocked(user) {
  return user && user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date();
}

async function registerFailedAttempt(user, email) {
  const newAttempts = (user.intentos_fallidos || 0) + 1;

  const blockedUntil =
    newAttempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + BLOCK_MINUTES * 60 * 1000)
      : null;

  await pool.query(
    `UPDATE tblUsuario
     SET intentos_fallidos = $1, bloqueado_hasta = $2
     WHERE idUsuario = $3`,
    [newAttempts, blockedUntil, user.idusuario]
  );

  await pool.query(
    `INSERT INTO tblIntentoLogin (email_ingresado, idUsuario, exitoso, observacion)
     VALUES ($1, $2, $3, $4)`,
    [
      email,
      user.idusuario,
      false,
      newAttempts >= MAX_ATTEMPTS
        ? `Usuario bloqueado por ${BLOCK_MINUTES} minutos`
        : "Contraseña incorrecta"
    ]
  );
}

async function clearAttempts(user, email) {
  await pool.query(
    `UPDATE tblUsuario
     SET intentos_fallidos = 0, bloqueado_hasta = NULL
     WHERE idUsuario = $1`,
    [user.idusuario]
  );

  await pool.query(
    `INSERT INTO tblIntentoLogin (email_ingresado, idUsuario, exitoso, observacion)
     VALUES ($1, $2, $3, $4)`,
    [email, user.idusuario, true, "Login exitoso"]
  );
}

module.exports = {
  isBlocked,
  registerFailedAttempt,
  clearAttempts,
  logAttempt,
  MAX_ATTEMPTS,
  BLOCK_MINUTES
};