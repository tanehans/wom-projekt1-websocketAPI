const jwt = require('jsonwebtoken');

function authenticateWebSocket(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    console.error('Invalid WebSocket token:', err.message);
    return null;
  }
}

module.exports = authenticateWebSocket;
