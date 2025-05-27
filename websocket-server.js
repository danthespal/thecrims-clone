const WebSocket = require('ws');
const http = require('http');
const { Pool } = require('pg');

// PostgreSQL client
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/thecrims_clone'
});

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('🟢 New WebSocket client connected');

  // Send last 50 messages
  db.query(`SELECT m.*, u.profile_name FROM "ClubMessages" m JOIN "User" u ON u.id = m.user_id ORDER BY m.created_at DESC LIMIT 50`)
    .then(res => ws.send(JSON.stringify({ type: 'init', messages: res.rows.reverse() })));

  ws.on('message', async (data) => {
    try {
      const { userId, message } = JSON.parse(data);
      if (!message || !userId) return;

      const res = await db.query(
        `INSERT INTO "ClubMessages" (user_id, message) VALUES ($1, $2) RETURNING id, message, created_at`,
        [userId, message]
      );

      const user = await db.query(`SELECT profile_name FROM "User" WHERE id = $1`, [userId]);

      const newMessage = {
        id: res.rows[0].id,
        message,
        created_at: res.rows[0].created_at,
        user_id: userId,
        profile_name: user.rows[0].profile_name,
      };

      // Broadcast to all clients
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'new_message', message: newMessage }));
        }
      });
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('🔴 Client disconnected');
  });
});

server.listen(4000, () => {
  console.log('✅ WebSocket server listening on ws://localhost:4000');
});
