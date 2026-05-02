// middleware/logger.js
// ============================================================
// APPLICATION-LEVEL MIDDLEWARE
//
// What is Middleware?
// Middleware is a function that sits between the incoming
// request and the final route handler. It has access to:
//   req  - the request object
//   res  - the response object
//   next - a function to pass control to the next middleware
//
// Application-level middleware is attached using app.use()
// and runs for EVERY request (unless a specific path is given).
// ============================================================

const logger = (req, res, next) => {
  // Step 1: Log when a request first arrives
  console.log('\n========================================');
  console.log('Step 1: Request received by server');
  console.log(`  Method  : ${req.method}`);
  console.log(`  URL     : ${req.url}`);
  console.log(`  Time    : ${new Date().toISOString()}`);
  console.log(`  Session : ${req.session ? (req.session.userId ? 'Logged in (userId: ' + req.session.userId + ')' : 'Not logged in') : 'No session'}`);
  console.log('Step 2: Logger middleware executed → calling next()');
  console.log('========================================\n');

  // IMPORTANT: Always call next() to pass control to the next middleware/route.
  // If you forget next(), the request will hang forever!
  next();
};

module.exports = logger;
