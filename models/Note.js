// models/Note.js
// ============================================================
// NOTE SCHEMA - defines the structure of Note documents.
// Each note has a title, content, and reference to who created it.
// ============================================================

const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '', // content starts empty, filled by the editor
    },
    // createdBy stores the ObjectId of the User who created this note
    // mongoose.Schema.Types.ObjectId is a special MongoDB ID type
    // ref: 'User' enables .populate() to fetch full user data
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    whiteboardData: {
      type: String,
      default: '[]'
    }
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('Note', noteSchema);
