// routes/notesRoutes.js
// ============================================================
// NOTES ROUTES (Router-level middleware demonstrated here)
//
// ROUTER-LEVEL MIDDLEWARE:
// Unlike application-level middleware (app.use), router-level
// middleware is attached to a specific router instance.
// It only runs for routes defined IN THIS router.
//
// Here we add:
//   1. A router-level logger (runs for all /notes/* routes)
//   2. sessionAuth protection (all /notes routes are protected)
// ============================================================

const express        = require('express');
const router         = express.Router();
const { sessionAuth } = require('../middleware/auth');
const {
  getAllNotes,
  createNote,
  showEditor,
  showWhiteboard,
  updateNote,
  deleteNote,
  blockingDemo,
  nonBlockingDemo,
  addCollaborator,
} = require('../controllers/notesController');

// ============================================================
// ROUTER-LEVEL MIDDLEWARE #1: Notes-specific logger
// This runs ONLY for /notes routes, not for /login or /register
// ============================================================
router.use((req, res, next) => {
  console.log(`[Notes Router Middleware] ${req.method} ${req.originalUrl}`);
  next();
});

// ============================================================
// ROUTER-LEVEL MIDDLEWARE #2: Protect ALL notes routes
// sessionAuth checks if req.session.userId exists.
// If not, redirects to /login.
// By using router.use(), we protect ALL routes below at once.
// ============================================================
router.use(sessionAuth);

// ---- CRUD Routes ----

// GET  /notes        → list all notes (Read)
router.get('/', getAllNotes);

// POST /notes        → create new note (Create)
router.post('/', createNote);

// GET  /notes/:id/edit → show editor page
router.get('/:id/edit', showEditor);

// GET  /notes/:id/whiteboard → show whiteboard page
router.get('/:id/whiteboard', showWhiteboard);

// PUT  /notes/:id    → update note content (Update) - called via AJAX
router.put('/:id', updateNote);

// DELETE /notes/:id  → delete a note (Delete) - called via AJAX
router.delete('/:id', deleteNote);

// POST /notes/:id/share → add a collaborator
router.post('/:id/share', addCollaborator);

// ---- Demo Routes ----
// GET /notes/demo/blocking    → blocking demo
// GET /notes/demo/nonblocking → non-blocking demo
router.get('/demo/blocking',    blockingDemo);
router.get('/demo/nonblocking', nonBlockingDemo);

module.exports = router;
