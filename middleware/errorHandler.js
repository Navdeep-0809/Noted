// middleware/errorHandler.js
// ============================================================
// ERROR-HANDLING MIDDLEWARE
//
// In Express, an error-handling middleware has FOUR parameters:
//   (err, req, res, next)
//
// Express recognizes it as an error handler because of the 4th param.
// It is always defined LAST in server.js, after all other routes.
//
// When any route calls next(err), Express skips all normal middleware
// and jumps straight to this error handler.
// ============================================================

const errorHandler = (err, req, res, next) => {
  // Log the full error stack to the console for debugging
  console.error('\n!!! ERROR CAUGHT BY ERROR HANDLER !!!');
  console.error('  Message:', err.message);
  console.error('  Stack  :', err.stack);

  // Set the HTTP status code
  // err.status is custom (we set it when throwing), default is 500
  const statusCode = err.status || 500;
  const message    = err.message || 'Internal Server Error';

  // If the request expects JSON (API call), send JSON response
  if (req.headers['content-type'] === 'application/json' ||
      req.xhr) {
    return res.status(statusCode).json({ error: message });
  }

  // Otherwise, render the error EJS page
  // We pass the error message and status to the view
  res.status(statusCode).render('error', {
    message,
    statusCode,
  });
};

module.exports = errorHandler;
