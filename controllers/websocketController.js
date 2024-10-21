const axios = require('axios');

let pendingUpdates = {};

// Handle new WebSocket connection
function handleConnection(ws, boardId, user, clients) {
  ws.on('message', async (message) => {
    const { action, ticketId, content, x, y } = JSON.parse(message);

    switch (action) {
      case 'create_note':
        await createNote(boardId, content, x, y, user.userId);
        broadcastUpdate(clients[boardId], { action: 'new_note', content, x, y });
        break;

      case 'update_note':
        await updateNote(ticketId, content, x, y);
        broadcastUpdate(clients[boardId], { action: 'note_updated', ticketId, content, x, y });
        break;

      default:
        console.error('Unknown action:', action);
    }
  });
}

// Broadcast update to all connected clients on a board
function broadcastUpdate(clientSet, data) {
  clientSet.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Function to call REST API to create a new note
async function createNote(boardId, content, x, y, userId) {
  try {
    await axios.post(`http://localhost:3000/api/boards/${boardId}/tickets`, { content, x, y }, {
      headers: { Authorization: `Bearer ${userId}` }
    });
  } catch (error) {
    console.error('Error creating note:', error.response?.data || error.message);
  }
}

// Function to call REST API to update a note
async function updateNote(ticketId, content, x, y) {
  try {
    await axios.put(`http://localhost:3000/api/boards/tickets/${ticketId}`, { content, x, y }, {
      headers: { Authorization: `Bearer ${userId}` }
    });
  } catch (error) {
    console.error('Error updating note:', error.response?.data || error.message);
  }
}

module.exports = { handleConnection, broadcastUpdate };

