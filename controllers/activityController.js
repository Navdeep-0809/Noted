// controllers/activityController.js
const Activity = require('../models/Activity');
const Note = require('../models/Note');

const getActivities = async (req, res, next) => {
  try {
    const userId = req.session.userId;

    // 1. Count historical activities
    const notesCreated = await Activity.countDocuments({ user: userId, action: 'created' });
    const notesDeleted = await Activity.countDocuments({ user: userId, action: 'deleted' });

    // 2. Get current notes for "last updated" and "collaborators"
    const notes = await Note.find({ createdBy: userId })
      .sort({ updatedAt: -1 });

    // 3. Calculate total collaborators
    const totalCollaborators = notes.reduce((acc, note) => {
      return acc + (note.collaborators ? note.collaborators.length : 0);
    }, 0);

    // 4. Fetch raw activity log for the timeline (optional, but keep it for context if needed, 
    // or just use the specific list requested)
    const activities = await Activity.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);

    res.render('activity', {
      username: req.session.username,
      stats: {
        notesCreated,
        notesDeleted,
        totalCollaborators
      },
      notes,
      activities
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActivities };
