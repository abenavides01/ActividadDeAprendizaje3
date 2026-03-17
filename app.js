const express = require("express");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const {
  getUserByEmail,
  validatePassword,
  createUser
} = require("./services/authService");

const {
  isBlocked,
  registerFailedAttempt,
  clearAttempts,
  logAttempt
} = require("./services/attemptService");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

// Mostrar login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// Procesar login
app.post("/login", async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    const user = await getUserByEmail(email);

    if (!user) {
      await logAttempt(email, null, false, "Usuario no encontrado");
      return res.redirect("/?error=1");
    }

    if (user.estado !== "activo") {
      await logAttempt(email, user.idusuario, false, "Usuario inactivo");
      return res.redirect("/?inactive=1");
    }

    if (isBlocked(user)) {
      await logAttempt(email, user.idusuario, false, "Usuario bloqueado");
      return res.redirect("/?blocked=1");
    }

    const validPassword = await validatePassword(password, user.password);

    if (!validPassword) {
      await registerFailedAttempt(user, email);

      const refreshedUser = await getUserByEmail(email);

      if (refreshedUser && isBlocked(refreshedUser)) {
        return res.redirect("/?blocked=1");
      }

      return res.redirect("/?error=1");
    }

    await clearAttempts(user, email);

    req.session.user = {
      id: user.idusuario,
      nombre: user.nombre,
      email: user.email
    };

    return res.redirect("/welcome?success=1");
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).send("Error interno del servidor");
  }
});

// Bienvenida
app.get("/welcome", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/?auth=required");
  }

  fs.readFile(path.join(__dirname, "views", "welcome.html"), "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Error al cargar la vista");
    }

    let html = data.replace("{{name}}", req.session.user.nombre);

    const successMessage = req.query.success === "1"
      ? `<div class="message success-message">✨ Usuario logueado satisfactoriamente</div>`
      : "";

    html = html.replace("{{message}}", successMessage);

    res.send(html);
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/?logout=1");
  });
});

// Ruta temporal para crear usuario de prueba
app.get("/crear-prueba", async (req, res) => {
  try {
    const user = await createUser("Andrea Benavides", "andrea@correo.com", "123456");
    res.send(`Usuario creado: ${user.nombre} - ${user.email}`);
  } catch (error) {
    console.error(error);
    res.send("No se pudo crear el usuario. Puede que ya exista.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});