const pool = require("../db/connection");

async function getUserByEmail(email) {
  const result = await pool.query(
    "SELECT * FROM tblUsuario WHERE email = $1 AND estado = 'activo'",
    [email]
  );

  return result.rows[0];
}

function validatePassword(plainPassword, dbPassword) {
  return plainPassword === dbPassword;
}

async function createUser(nombre, email, password) {
  const result = await pool.query(
    `INSERT INTO tblUsuario (nombre, email, password)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [nombre, email, password]
  );

  return result.rows[0];
}

module.exports = {
  getUserByEmail,
  validatePassword,
  createUser
};