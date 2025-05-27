const WebSocket = require('ws');
const http = require('http');
const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Set();
const userSockets = new Map();
const onlineUsers = new Set();

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
      console.log('📨 Incoming:', data);
      const parsed = JSON.parse(data);

      if (parsed.type === 'join') {
        const { sessionToken } = parsed;

        if (!sessionToken) {
          console.warn('❌ No sessionToken provided.');
          ws.send(JSON.stringify({ type: 'system', message: '❌ Missing session token.' }));
          ws.close();
          return;
        }

        const result = await db.query(`SELECT user_id FROM "Sessions" WHERE id = $1`, [sessionToken]);
        if (result.rowCount === 0) {
          console.warn('❌ Invalid sessionToken:', sessionToken);
          ws.send(JSON.stringify({ type: 'system', message: '❌ Invalid or expired session.' }));
          ws.close();
          return;
        }

        userId = result.rows[0].user_id;
        userSockets.set(userId, ws);
        clients.add(ws);
        onlineUsers.add(userId);

        const messagesRes = await db.query(`
          SELECT cm.id, cm.message, cm.created_at, u.id as user_id, u.profile_name
          FROM "ClubMessages" cm
          JOIN "User" u ON cm.user_id = u.id
          ORDER BY cm.created_at DESC
          LIMIT 20
        `);

        ws.send(JSON.stringify({ type: 'init', messages: messagesRes.rows.reverse() }));
        broadcast({ type: 'system', message: `🟢 User #${userId} joined the club chat.` });
        sendOnlineUsersUpdate();
        return;
      }

      if (parsed.type !== 'message' || !userId || !parsed.message) return;

      const isPrivate = !!parsed.recipientId;
      const timestamp = new Date().toISOString();

      const user = await db.query(`SELECT profile_name FROM "User" WHERE id = $1`, [userId]);
      const profileName = user.rows[0]?.profile_name ?? 'Unknown';

      if (isPrivate) {
        if (parsed.recipientId === userId) {
          ws.send(JSON.stringify({ type: 'system', message: `❌ You cannot message yourself.` }));
          return;
        }

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
          user_id: userId,
          profile_name: profileName,
          recipient_id: parsed.recipientId,
          recipient_profile_name: recipientProfileName,
          type: 'private_message'
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
          [userId, parsed.recipientId, parsed.message]
        );
      } else {
        const payload = {
          id: Date.now(),
          message: parsed.message,
          created_at: timestamp,
          user_id: userId,
          profile_name: profileName,
          type: 'new_message'
        };

        broadcast({ type: 'new_message', message: payload });

        await db.query(
          `INSERT INTO "ClubMessages" (user_id, message) VALUES ($1, $2)`,
          [userId, parsed.message]
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