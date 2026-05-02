// server.js
// ============================================================
// MAIN ENTRY POINT
//
// REQUEST LIFECYCLE (Step by Step):
//   1. Browser sends HTTP request to server
//   2. express receives it and passes through middleware stack
//   3. Application-level middleware runs first (logger, session, etc.)
//   4. Router-level middleware runs next (notes router middleware)
//   5. Route handler (controller) processes the request
//   6. Response is sent back to the browser
//   7. If any error occurs → error-handling middleware catches it
// ============================================================

require('dotenv').config(); // Load .env variables into process.env

const express      = require('express');
const http         = require('http');        // Node's built-in HTTP module
const { Server }   = require('socket.io');  // Socket.io server class
const mongoose     = require('mongoose');
const session      = require('express-session');
const cookieParser = require('cookie-parser');
const path         = require('path');

// Import our custom middleware
const logger       = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Import route files
const authRoutes  = require('./routes/authRoutes');
const notesRoutes = require('./routes/notesRoutes');
const activityRoutes = require('./routes/activityRoutes');

// Import Socket.io handler
const socketHandler = require('./socket/socketHandler');

// ============================================================
// 1. CREATE EXPRESS APP + HTTP SERVER
//
// We must wrap Express with http.createServer() so that
// Socket.io can attach to the SAME port as Express.
// ============================================================
const app    = express();
const server = http.createServer(app); // http server wraps express

// ============================================================
// 2. SETUP SOCKET.IO
//
// new Server(httpServer, options) attaches Socket.io to our server.
// Socket.io will listen on the same port as Express.
// ============================================================
const io = new Server(server, {
  cors: { origin: '*' } // allow all origins for demo purposes
});

socketHandler(io); // register all socket event handlers

// ============================================================
// 3. CONNECT TO MONGODB
//
// mongoose.connect() creates a connection pool to MongoDB.
// All subsequent Mongoose queries reuse this connection.
// MongoDB URI format: mongodb://host:port/database_name
// ============================================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected:', process.env.MONGO_URI))
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1); // exit process if DB connection fails
  });

// ============================================================
// 4. TEMPLATE ENGINE SETUP
//
// EJS (Embedded JavaScript) is a template engine.
// app.set('view engine', 'ejs') tells Express to use EJS.
// app.set('views', path) tells Express where to find .ejs files.
// When we call res.render('notes'), Express looks for views/notes.ejs
// ============================================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================================
// 5. APPLICATION-LEVEL MIDDLEWARE
//
// THIRD-PARTY MIDDLEWARE (express.json, express.urlencoded):
//   - express.json()       → parses JSON request bodies (for fetch/AJAX)
//   - express.urlencoded() → parses HTML form submissions
//   These are built into Express (previously needed body-parser package)
//
// ORDER MATTERS: middleware runs in the order it is defined.
// ============================================================
app.use(express.json());                      // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form bodies
app.use(cookieParser());                      // parse cookies into req.cookies
app.use(express.static(path.join(__dirname, 'public'))); // serve static files (CSS, etc.)

// SESSION MIDDLEWARE (express-session)
// express-session stores session data on the SERVER.
// A unique session ID is sent to the browser as a cookie.
// On each request, the browser sends back the session ID,
// and express-session loads the corresponding session data.
app.use(session({
  secret: process.env.SESSION_SECRET, // used to sign the session ID cookie
  resave: false,                       // don't save session if nothing changed
  saveUninitialized: false,            // don't create session until something stored
  cookie: {
    maxAge: 86400000,  // session cookie expires in 1 day (ms)
    httpOnly: true,    // cookie not accessible via JavaScript (security)
  },
}));

// OUR CUSTOM APPLICATION-LEVEL LOGGER MIDDLEWARE
// This runs for EVERY incoming request before any route is matched
app.use(logger);

// ============================================================
// 6. MOUNT ROUTES
//
// app.use('/path', router) mounts a router at a path prefix.
// All routes in authRoutes run under '/' (e.g. /login, /register)
// All routes in notesRoutes run under '/notes' (e.g. /notes, /notes/:id)
// ============================================================

// Home route
app.get('/', (req, res) => {
  // If already logged in, redirect to notes
  if (req.session && req.session.userId) {
    return res.redirect('/notes');
  }
  res.render('home');
});

// Auth routes: /register, /login, /logout
app.use('/', authRoutes);

// Notes routes: /notes, /notes/:id/edit, etc.
app.use('/notes', notesRoutes);

// Activity routes: /activity
app.use('/activity', activityRoutes);

// ============================================================
// 7. 404 HANDLER
// If no route matched, create a 404 error and pass to error handler
// ============================================================
app.use((req, res, next) => {
  const err = new Error(`Page not found: ${req.url}`);
  err.status = 404;
  next(err); // skip to error-handling middleware
});

// ============================================================
// 8. ERROR-HANDLING MIDDLEWARE
// Must be defined LAST. Has 4 parameters: (err, req, res, next)
// Express knows it's an error handler because of the 4th param.
// ============================================================
app.use(errorHandler);

// ============================================================
// 9. START SERVER
//
// server.listen() (not app.listen()) so Socket.io works.
// We listen on the PORT from .env file.
// ============================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`   View Engine : EJS`);
  console.log(`   Database    : MongoDB (${process.env.MONGO_URI})`);
  console.log(`   Socket.io   : Active on same port\n`);
});
