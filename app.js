require('dotenv').config();
const WebSocket = require('ws');
const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { handleConnection, broadcastUpdate } = require('./controllers/websocketController');
const authenticateWebSocket = require('./middlewares/authMiddleware');

// Setup WebSocket server
const app = express();
const server = app.listen(process.env.PORT || 8080, () => {
  console.log(`WebSocket server running on port ${process.env.PORT || 8080}`);
});

const wss = new WebSocket.Server({ server });

let clients = {};

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.split('?')[1]);
  const boardId = params.get('board');
  const token = params.get('token');

  const user = authenticateWebSocket(token);
  if (!user) {
    ws.close();
    return;
  }

  if (!clients[boardId]) {
    clients[boardId] = new Set();
  }

  clients[boardId].add(ws);

  handleConnection(ws, boardId, user, clients);

  ws.on('close', () => {
    clients[boardId].delete(ws);
    if (clients[boardId].size === 0) {
      delete clients[boardId];
    }
  });
});

