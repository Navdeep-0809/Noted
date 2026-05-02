// socket/socketHandler.js
// ============================================================
// SOCKET.IO REAL-TIME HANDLER
//
// What is Socket.io?
// Socket.io enables real-time, bidirectional communication
// between the browser (client) and the server.
//
// Unlike HTTP (request → response), Socket.io keeps a persistent
// connection (WebSocket) open, so the server can PUSH data to the
// client at any time without the client asking.
//
// How it works:
//   1. Client connects → socket.io fires 'connection' event
//   2. Client emits 'joinNote' with a noteId → server puts them in a "room"
//   3. Client types in textarea → emits 'editNote' with new content
//   4. Server receives 'editNote' → broadcasts 'receiveUpdate' to all others in the room
//
// Rooms: A Socket.io room is a named channel. Sockets can join/leave rooms.
// socket.to(room).emit() sends to everyone in the room EXCEPT the sender.
// ============================================================

const Note = require('../models/Note');

const socketHandler = (io) => {
  // 'connection' fires whenever a new client connects
  io.on('connection', (socket) => {
    console.log(`\n[Socket.io] New client connected: ${socket.id}`);

    // --------------------------------------------------------
    // EVENT: joinNote
    // Client sends noteId when they open an editor page.
    // We add this socket to a "room" named after the noteId.
    // Everyone editing the same note is in the same room.
    // --------------------------------------------------------
    socket.on('joinNote', async ({ noteId, userId }) => {
      socket.join(noteId); // join the room
      socket.userId = userId; // Store userId on the socket for later use in editNote
      console.log(`[Socket.io] Socket ${socket.id} (User: ${userId}) joined room: ${noteId}`);
    });

    // --------------------------------------------------------
    // EVENT: editNote
    // Client sends { noteId, content } whenever the textarea changes.
    // We:
    //   1. Save the new content to MongoDB (persistence)
    //   2. Track unique collaborator if they make an edit
    //   3. Broadcast the update to all OTHER clients in the same room
    // --------------------------------------------------------
    socket.on('editNote', async ({ noteId, content }) => {
      console.log(`[Socket.io] editNote received for room: ${noteId}`);

      try {
        // Save updated content and track unique collaborator simultaneously
        const update = { content };
        if (socket.userId) {
          await Note.findByIdAndUpdate(noteId, { 
            $set: { content },
            $addToSet: { collaborators: socket.userId } 
          });
        } else {
          await Note.findByIdAndUpdate(noteId, { content });
        }

        // Broadcast to everyone in the room EXCEPT the sender
        // socket.to(room).emit(event, data)
        socket.to(noteId).emit('receiveUpdate', { content });

        console.log(`[Socket.io] Broadcasted update to room: ${noteId}`);
      } catch (err) {
        console.error('[Socket.io] Error saving note:', err.message);
      }
    });

    // --------------------------------------------------------
    // EVENT: disconnect
    // Fires automatically when a client closes the tab or loses connection.
    // Socket.io automatically removes the socket from all rooms on disconnect.
    // --------------------------------------------------------
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });

    // --------------------------------------------------------
    // WHITEBOARD EVENTS
    // --------------------------------------------------------
    socket.on('draw', ({ noteId, drawingData }) => {
      // Broadcast coordinates to everyone else in the room
      socket.to(noteId).emit('draw', drawingData);
    });

    socket.on('saveWhiteboard', async ({ noteId, fullData }) => {
      try {
        await Note.findByIdAndUpdate(noteId, { whiteboardData: JSON.stringify(fullData) });
      } catch (err) {
        console.error('[Socket.io] Error saving whiteboard:', err.message);
      }
    });

    socket.on('clearWhiteboard', async (noteId) => {
      try {
        await Note.findByIdAndUpdate(noteId, { whiteboardData: '[]' });
        socket.to(noteId).emit('clearWhiteboard');
      } catch (err) {
        console.error('[Socket.io] Error clearing whiteboard:', err.message);
      }
    });
  });
};

module.exports = socketHandler;
