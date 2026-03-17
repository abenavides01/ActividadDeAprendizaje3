const pool = require("../db/connection");
const bcrypt = require("bcrypt");

async function getUserByEmail(email) {
  const result = await pool.query(
    "SELECT * FROM tblUsuario WHERE email = $1 AND estado = 'activo'",
    [email]
  );

  return result.rows[0];
}

async function validatePassword(plainPassword, dbPassword) {
  return await bcrypt.compare(plainPassword, dbPassword);
}

async function createUser(nombre, email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO tblUsuario (nombre, email, password)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [nombre, email, hashedPassword]
  );

  return result.rows[0];
}

module.exports = {
  getUserByEmail,
  validatePassword,
  createUser
};