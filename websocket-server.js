// ✅ UPDATED websocket-server.js

const WebSocket = require('ws');
const http = require('http');
const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/thecrims_clone'
});

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Set();
const userSockets = new Map(); // userId -> ws
const onlineUsers = new Set(); // userIds

function broadcast(payload) {
  const data = JSON.stringify(payload);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function sendOnlineUsersUpdate() {
  broadcast({ type: 'online_users', users: Array.from(onlineUsers) });
}

wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', async (data) => {
    try {
      const parsed = JSON.parse(data);

      if (parsed.type === 'join') {
        if (!parsed.userId) return;

        userId = parsed.userId;
        userSockets.set(userId, ws);
        clients.add(ws);
        onlineUsers.add(userId);

        const result = await db.query(`
          SELECT cm.id, cm.message, cm.created_at, u.id as user_id, u.profile_name
          FROM "ClubMessages" cm
          JOIN "User" u ON cm.user_id = u.id
          ORDER BY cm.created_at DESC
          LIMIT 20
        `);

        ws.send(JSON.stringify({ type: 'init', messages: result.rows.reverse() }));
        broadcast({ type: 'system', message: `🟢 User #${userId} joined the club chat.` });
        sendOnlineUsersUpdate();
        return;
      }

      if (parsed.type !== 'message' || !parsed.userId || !parsed.message) return;

      const isPrivate = !!parsed.recipientId;
      const timestamp = new Date().toISOString();

      const user = await db.query(`SELECT profile_name FROM "User" WHERE id = $1`, [parsed.userId]);
      const profileName = user.rows[0]?.profile_name ?? 'Unknown';

      if (isPrivate) {
        const recipientUser = await db.query(`SELECT id, profile_name FROM "User" WHERE id = $1`, [parsed.recipientId]);
        if (recipientUser.rowCount === 0) {
          ws.send(JSON.stringify({ type: 'system', message: `❌ Private message failed: user does not exist.` }));
          return;
        }

        const recipientProfileName = recipientUser.rows[0].profile_name;

        if (!onlineUsers.has(parsed.recipientId)) {
          ws.send(JSON.stringify({ type: 'system', message: `❌ ${recipientProfileName} is not online.` }));
          return;
        }

        const payload = {
          id: Date.now(),
          message: parsed.message,
          created_at: timestamp,
          user_id: parsed.userId,
          profile_name: profileName,
          recipient_id: parsed.recipientId,
          recipient_profile_name: recipientProfileName
        };

        const recipientWs = userSockets.get(parsed.recipientId);
        if (recipientWs?.readyState === WebSocket.OPEN) {
          recipientWs.send(JSON.stringify({ type: 'private_message', message: payload }));
        }
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'private_message', message: payload }));
        }

        await db.query(
          `INSERT INTO "PrivateMessages" (sender_id, recipient_id, message) VALUES ($1, $2, $3)`,
          [parsed.userId, parsed.recipientId, parsed.message]
        );
      } else {
        const payload = {
          id: Date.now(),
          message: parsed.message,
          created_at: timestamp,
          user_id: parsed.userId,
          profile_name: profileName
        };

        broadcast({ type: 'new_message', message: payload });

        await db.query(
          `INSERT INTO "ClubMessages" (user_id, message) VALUES ($1, $2)`,
          [parsed.userId, parsed.message]
        );
      }
    } catch (err) {
      console.error('❌ Error handling message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    if (userId !== null) {
      userSockets.delete(userId);
      onlineUsers.delete(userId);
      broadcast({ type: 'system', message: `🔴 User #${userId} left the chat.` });
      sendOnlineUsersUpdate();
    }
    console.log('🔴 Client disconnected');
  });

  clients.add(ws);
  console.log('🟢 New WebSocket client connected');
});

server.listen(4000, () => {
  console.log('✅ WebSocket server listening on ws://localhost:4000');
});