// controllers/authController.js
// ============================================================
// AUTH CONTROLLER
// Controllers contain the actual LOGIC for each route.
// Routes just define the URL + method, controllers handle the work.
// This separation is called the MVC (Model-View-Controller) pattern.
// ============================================================

const User = require('../models/User');
const Activity = require('../models/Activity');
const jwt  = require('jsonwebtoken');

// ============================================================
// SHOW REGISTER PAGE
// GET /register → renders register.ejs
// ============================================================
const showRegister = (req, res) => {
  res.render('register', { error: null });
};

// ============================================================
// HANDLE REGISTER FORM SUBMISSION
// POST /register → create new user in DB
// ============================================================
const registerUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Check if username already exists
    const existing = await User.findOne({ username });
    if (existing) {
      return res.render('register', { error: 'Username already taken!' });
    }

    // Create user - password hashing happens automatically via pre-save hook
    const user = new User({ username, password });
    await user.save(); // this triggers the bcrypt pre-save hook

    console.log(`New user registered: ${username}`);

    // Log Activity
    await Activity.create({
      user: user._id,
      action: 'registered',
      entityType: 'User',
      entityId: user._id,
      details: `User registered: ${username}`
    });

    res.redirect('/login');
  } catch (err) {
    next(err); // pass error to error-handling middleware
  }
};

// ============================================================
// SHOW LOGIN PAGE
// GET /login → renders login.ejs
// ============================================================
const showLogin = (req, res) => {
  res.render('login', { error: null });
};

// ============================================================
// HANDLE LOGIN FORM SUBMISSION
// POST /login
//
// This demonstrates BOTH session AND JWT generation:
//   1. Create an express-session (for SSR page protection)
//   2. Generate a JWT token (stored in cookie, for API protection)
// ============================================================
const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user in DB by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', { error: 'Invalid username or password' });
    }

    // Use our custom comparePassword method (uses bcrypt.compare internally)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('login', { error: 'Invalid username or password' });
    }

    // ---- CREATE SESSION ----
    // express-session stores this data on the SERVER
    // A session ID cookie is sent to the browser automatically
    req.session.userId   = user._id.toString();
    req.session.username = user.username;
    console.log('Session created for user:', user.username);

    // ---- GENERATE JWT ----
    // jwt.sign(payload, secret, options) creates a signed token
    // The payload contains non-sensitive user info
    const token = jwt.sign(
      { userId: user._id, username: user.username }, // payload
      process.env.JWT_SECRET,                         // secret key
      { expiresIn: '1d' }                             // token expires in 1 day
    );

    // Store JWT in an HTTP-only cookie (not accessible by JS, more secure)
    res.cookie('token', token, {
      httpOnly: true,    // prevents JS access (XSS protection)
      maxAge: 86400000,  // 1 day in milliseconds
    });

    console.log('JWT generated and stored in cookie for user:', user.username);

    // Log Activity
    await Activity.create({
      user: user._id,
      action: 'logged in',
      entityType: 'User',
      entityId: user._id,
      details: `User logged in: ${user.username}`
    });

    res.redirect('/notes');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// LOGOUT
// GET /logout → destroy session and clear cookie
// ============================================================
const logoutUser = (req, res, next) => {
  // Destroy the session on the server
  req.session.destroy((err) => {
    if (err) return next(err);

    // Clear the JWT cookie from the browser
    res.clearCookie('token');
    res.clearCookie('connect.sid'); // express-session cookie name

    console.log('User logged out. Session destroyed.');
    res.redirect('/login');
  });
};

module.exports = { showRegister, registerUser, showLogin, loginUser, logoutUser };
