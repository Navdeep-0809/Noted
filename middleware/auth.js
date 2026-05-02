// middleware/auth.js
// ============================================================
// AUTHENTICATION MIDDLEWARE
//
// Two types of protection are demonstrated here:
//
// 1. sessionAuth  - Checks express-session for a logged-in user.
//                   Used to protect SSR (EJS) page routes.
//
// 2. jwtAuth      - Checks a JWT token from the cookie.
//                   Used to protect JSON/API routes.
//
// This file shows both approaches side-by-side for viva clarity.
// ============================================================

const jwt = require('jsonwebtoken');

// ============================================================
// 1. SESSION-BASED AUTH MIDDLEWARE
// express-session stores the session on the SERVER and sends a
// session ID cookie to the browser. On each request, the browser
// sends back the cookie, and express-session looks up the session.
// ============================================================
const sessionAuth = (req, res, next) => {
  console.log('Step 3: sessionAuth middleware - checking session...');

  if (req.session && req.session.userId) {
    // Session exists and has a userId → user is logged in
    console.log('  Session valid. User ID:', req.session.userId);
    return next(); // allow the request to continue
  }

  // No session → redirect to login page
  console.log('  No valid session. Redirecting to /login');
  res.redirect('/login');
};

// ============================================================
// 2. JWT-BASED AUTH MIDDLEWARE
// JWT (JSON Web Token) stores user info inside a signed token.
// The token is stored in a cookie and sent with every request.
// We verify the token using the secret key.
//
// JWT vs Session:
//   - JWT is stateless (no server storage needed)
//   - Session is stateful (stored on server)
// ============================================================
const jwtAuth = (req, res, next) => {
  console.log('Step 3: jwtAuth middleware - checking JWT token...');

  // Read the JWT from the cookie named 'token'
  const token = req.cookies ? req.cookies.token : null;

  if (!token) {
    console.log('  No JWT token found.');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    // jwt.verify() checks the signature and decodes the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach decoded user info to request object
    console.log('  JWT valid. Decoded user:', decoded.username);
    next();
  } catch (err) {
    console.log('  JWT invalid or expired.');
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = { sessionAuth, jwtAuth };
