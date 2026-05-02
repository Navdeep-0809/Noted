// controllers/notesController.js
// ============================================================
// NOTES CONTROLLER
// Handles all CRUD operations for notes.
// CRUD = Create, Read, Update, Delete
// These map directly to HTTP methods:
//   Create → POST
//   Read   → GET
//   Update → PUT
//   Delete → DELETE
// ============================================================

const Note = require('../models/Note');
const Activity = require('../models/Activity');
const User = require('../models/User');

// ============================================================
// GET /notes → List all notes for the logged-in user
// SSR: We render the notes.ejs template with data from MongoDB
// This is Server-Side Rendering - HTML is built on the server
// and sent to the browser as a complete page.
// ============================================================
const getAllNotes = async (req, res, next) => {
  try {
    console.log('Step 4: notesController.getAllNotes → querying MongoDB');

    // Find notes where user is either the creator OR a collaborator
    const notes = await Note.find({
      $or: [
        { createdBy: req.session.userId },
        { collaborators: req.session.userId }
      ]
    }).populate('createdBy', 'username') // so we can show who owns the note
      .sort({ updatedAt: -1 }); // newest update first

    console.log(`  Found ${notes.length} notes for user ${req.session.username}`);

    // Calculate Dashboard Statistics
    const totalNotes = notes.length;

    // res.render(view, data) → tells EJS to render 'views/notes.ejs'
    // and inject the 'notes' array and 'username' into the template
    res.render('notes', {
      notes,
      username: req.session.username,
      userId: req.session.userId,
      stats: {
        totalNotes
      }
    });
  } catch (err) {
    next(err); // forward to error-handling middleware
  }
};

// ============================================================
// POST /notes → Create a new note
// req.body contains the form data sent from the HTML form
// express.json() and express.urlencoded() parse this body
// ============================================================
const createNote = async (req, res, next) => {
  try {
    const { title } = req.body;
    console.log(`Step 4: notesController.createNote → creating "${title}"`);

    // new Note({...}) creates a note document (in memory)
    // .save() writes it to MongoDB
    const note = new Note({
      title,
      content: '',
      createdBy: req.session.userId, // link note to logged-in user
    });
    await note.save();

    console.log(`  Note created with id: ${note._id}`);

    // Log Activity
    await Activity.create({
      user: req.session.userId,
      action: 'created',
      entityType: 'Note',
      entityId: note._id,
      details: `Created note: "${title}"`
    });

    res.redirect('/notes'); // redirect back to notes list (POST-Redirect-GET pattern)
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /notes/:id/edit → Show the editor page for one note
// :id is a URL parameter (dynamic segment)
// req.params.id gives us the note's MongoDB ObjectId
// ============================================================
const showEditor = async (req, res, next) => {
  try {
    console.log(`Step 4: notesController.showEditor → fetching note ${req.params.id}`);

    // Note.findById() → fetch one document by its _id
    const note = await Note.findById(req.params.id);

    if (!note) {
      // Create an error and pass it to the error handler
      const err = new Error('Note not found');
      err.status = 404;
      return next(err);
    }

    // Security check: creator or collaborator
    const isCreator = note.createdBy.toString() === req.session.userId;
    const isCollaborator = note.collaborators.includes(req.session.userId);

    if (!isCreator && !isCollaborator) {
      const err = new Error('Forbidden: You do not have access to this note');
      err.status = 403;
      return next(err);
    }

    // Render the editor view with note data and username
    res.render('editor', {
      note,
      username: req.session.username,
      userId: req.session.userId,
    });
  } catch (err) {
    next(err);
  }
};

const showWhiteboard = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return next(new Error('Note not found'));

    // Security check: creator or collaborator
    const isCreator = note.createdBy.toString() === req.session.userId;
    const isCollaborator = note.collaborators.includes(req.session.userId);

    if (!isCreator && !isCollaborator) {
      const err = new Error('Forbidden: Access denied');
      err.status = 403;
      return next(err);
    }

    res.render('whiteboard', {
      note,
      username: req.session.username,
      userId: req.session.userId,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PUT /notes/:id → Update note content
// Called via AJAX from the editor page when user types
// We use findByIdAndUpdate() for an atomic update operation
// ============================================================
const updateNote = async (req, res, next) => {
  try {
    const { content, title } = req.body;
    console.log(`Step 4: notesController.updateNote → updating note ${req.params.id}`);

    // findByIdAndUpdate(id, update, options)
    // { new: true } → return the updated document
    // { runValidators: true } → run schema validators on update
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { content, title },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    console.log(`  Note updated: ${note._id}`);

    // Log Activity
    await Activity.create({
      user: req.session.userId,
      action: 'updated',
      entityType: 'Note',
      entityId: note._id,
      details: `Updated note: "${note.title}"`
    });

    res.json({ message: 'Note updated successfully', note });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// DELETE /notes/:id → Delete a note
// findByIdAndDelete() removes the document from MongoDB
// ============================================================
const deleteNote = async (req, res, next) => {
  try {
    console.log(`Step 4: notesController.deleteNote → deleting note ${req.params.id}`);

    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    console.log(`  Note deleted: ${req.params.id}`);

    // Log Activity
    await Activity.create({
      user: req.session.userId,
      action: 'deleted',
      entityType: 'Note',
      entityId: note._id,
      details: `Deleted note: "${note.title}"`
    });

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// BLOCKING vs NON-BLOCKING DEMO
// GET /notes/demo/blocking   → blocks the entire server for 3s
// GET /notes/demo/nonblocking → uses setTimeout (non-blocking)
//
// Blocking: synchronous code that freezes the event loop
// Non-Blocking: async code that lets the event loop continue
// ============================================================
const blockingDemo = (req, res) => {
  console.log('DEMO: Blocking code started...');

  // This loop BLOCKS the entire Node.js event loop!
  // No other request can be processed during this time.
  const start = Date.now();
  while (Date.now() - start < 3000) {
    // busy-wait for 3 seconds (simulates blocking operation)
  }

  console.log('DEMO: Blocking code finished after 3 seconds');
  res.send('<h2>Blocking demo: Server was frozen for 3 seconds!</h2><a href="/notes">Back</a>');
};

const nonBlockingDemo = (req, res) => {
  console.log('DEMO: Non-blocking code started...');

  // setTimeout is NON-BLOCKING - it schedules the callback
  // and immediately returns control to the event loop.
  // Other requests can still be handled during the 3 second wait.
  setTimeout(() => {
    console.log('DEMO: Non-blocking callback executed after 3 seconds');
    res.send('<h2>Non-blocking demo: Server stayed free for 3 seconds!</h2><a href="/notes">Back</a>');
  }, 3000);

  console.log('DEMO: Event loop is FREE while waiting...');
};

const addCollaborator = async (req, res, next) => {
  try {
    const { username } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) return res.status(404).json({ message: 'Note not found' });
    
    // Only creator can share
    if (note.createdBy.toString() !== req.session.userId) {
      return res.status(403).json({ message: 'Only the creator can share this note' });
    }

    const userToInvite = await User.findOne({ username });
    if (!userToInvite) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't add yourself
    if (userToInvite._id.toString() === req.session.userId) {
      return res.status(400).json({ message: 'You are already the owner' });
    }

    // Add to collaborators if not already there
    if (!note.collaborators.includes(userToInvite._id)) {
      note.collaborators.push(userToInvite._id);
      await note.save();

      // Log Activity
      await Activity.create({
        user: req.session.userId,
        action: 'updated',
        entityType: 'Note',
        entityId: note._id,
        details: `Shared note "${note.title}" with ${username}`
      });
    }

    res.json({ message: `Successfully shared with ${username}` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllNotes,
  createNote,
  showEditor,
  showWhiteboard,
  updateNote,
  deleteNote,
  blockingDemo,
  nonBlockingDemo,
  addCollaborator
};
