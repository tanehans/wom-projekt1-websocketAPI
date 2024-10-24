const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });

const clients = {};
const boards = {};

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        let msg;
        try {
            msg = JSON.parse(message);
        } catch (e) {
            console.error('Invalid JSON', e);
            return;
        }

        if (msg.type === 'join') {
            const { token, boardId } = msg;
            // TODO: Kolla att usern har access till boardId
            ws.boardId = boardId;

            if (!clients[boardId]) {
                clients[boardId] = new Set();
            }
            clients[boardId].add(ws);

            // Skicka hela nuvarande board staten till klienten
            const boardState = boards[boardId] || [];
            ws.send(JSON.stringify({ type: 'init', tickets: boardState }));
        } else if (['createTicket', 'updateTicket', 'deleteTicket', 'moveTicket'].includes(msg.type)) {
            const boardId = ws.boardId;
            if (!boardId) {
                console.error('No boardId associated with this connection');
                return;
            }

            // Uppdatera board state när den ändras på en klient
            let boardState = boards[boardId] || [];
            switch (msg.type) {
                case 'createTicket':
                    boardState.push(msg.ticket);
                    break;
                case 'updateTicket':
                    const updateIndex = boardState.findIndex(t => t.id === msg.ticket.id);
                    if (updateIndex !== -1) boardState[updateIndex] = msg.ticket;
                    break;
                case 'deleteTicket':
                    boards[boardId] = boardState.filter(t => t.id !== msg.ticketId);
                    break;
                case 'moveTicket':
                    const moveIndex = boardState.findIndex(t => t.id === msg.ticket.id);
                    if (moveIndex !== -1) boardState[moveIndex].position = msg.ticket.position;
                    break;
            }
            boards[boardId] = boardState;

            // Skicka uppdatering till alla klienter
            clients[boardId].forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(msg));
                }
            });
        }
    });

    ws.on('close', () => {
        const boardId = ws.boardId;
        if (boardId && clients[boardId]) {
            clients[boardId].delete(ws);
            if (clients[boardId].size === 0) {
                delete clients[boardId];
            }
        }
    });
});