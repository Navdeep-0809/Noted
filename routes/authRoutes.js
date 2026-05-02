// routes/authRoutes.js
// ============================================================
// AUTH ROUTES
// Routes define the URL + HTTP method + which controller to call.
// We use express.Router() to create a modular route handler.
// This is then mounted in server.js using app.use('/...')
// ============================================================

const express = require('express');
const router  = express.Router(); // create a mini Express app

const {
  showRegister,
  registerUser,
  showLogin,
  loginUser,
  logoutUser,
} = require('../controllers/authController');

// GET  /register → show the registration form
router.get('/register', showRegister);

// POST /register → process the registration form
router.post('/register', registerUser);

// GET  /login → show the login form
router.get('/login', showLogin);

// POST /login → process login, create session + JWT
router.post('/login', loginUser);

// GET  /logout → destroy session, clear cookies
router.get('/logout', logoutUser);

module.exports = router;
