# 🕹️ TheCrims Clone — Next.js Full-Stack Game

A full-featured multiplayer game inspired by *TheCrims*, built with a modern tech stack including **Next.js**, **PostgreSQL**, **TailwindCSS**, and **TypeScript**.

---

## 📌 Features

- 🧍 User registration, login, and session persistence (7 days)
- 🔐 Secure session handling and rate-limited API access
- 🧪 Full gameplay systems:
  - Robbery system with cooldowns
  - Willpower regeneration
  - Casino (Blackjack, deposit/withdraw)
  - Gear and inventory management
  - Shop system with items and types
- 💬 Real-time Club Chat (WebSocket)
- 🎯 Dynamic dashboard with level/respect progress
- ⚙️ Modular, scalable API design with full audit compliance

---

## ⚙️ Tech Stack

| Layer       | Technology                  |
|-------------|-----------------------------|
| Frontend    | Next.js (App Router)        |
| UI          | TailwindCSS + React Context |
| Backend     | API Routes (REST-like)      |
| DB          | PostgreSQL via `postgres`   |
| Auth        | Custom session cookies (no OAuth) |
| Real-time   | WebSocket via `ws` + Node.js |
| Typesafety  | TypeScript everywhere       |

---

## 🔐 Authentication

- Custom `session-token` stored in HTTP-only cookie
- Session lifecycle: created on login, persisted for 7 days
- Session auto-refresh via `useSession()` hook
- Logout destroys server and cookie session safely

---

## 🧠 Core Systems

### Robbery
- Action-based system with configurable cooldowns
- Centralized logic via `robberyConfig.ts`
- Returns rewards and updates stats

### Will Regeneration
- Time-based regeneration engine (`regenWill.ts`)
- Runs on session load and keeps values accurate

### Casino
- Supports deposits, withdrawals, and Blackjack
- Full transactional safety
- Player wallet and casino wallet separated

### Gear & Inventory
- Fully equipped gear slots (via item loader)
- Inventory quantity limits and slot caps
- Equipment state stored per user

### Items & Shop
- Public `/items` API for static data
- Buy items from shop, stored in DB
- Types, tags, quantity rules handled server-side

---

## 💬 Club Chat (WebSocket)

Players can chat live in the **Clubs** tab using a dedicated WebSocket server.

### 🧪 Starting the WebSocket Server Locally

1. Make sure PostgreSQL is running and the database is seeded.
2. Ensure your `.env` or system environment includes:

   ```env
   DATABASE_URL=postgresql://postgres:admin@localhost:5432/thecrims_clone
   ```

3. From the root project directory, run:

   ```bash
   node websocket-server.js
   ```

4. You should see:

   ```
   ✅ WebSocket server listening on ws://localhost:4000
   ```

### 💡 Features:
- Shows last 50 messages on connect
- Real-time broadcast of new messages
- Disconnect/connection handling with fallback UI
- Client-side auto-scroll to bottom

---

## ✅ API Quality

This project has undergone a **full route-by-route audit**, ensuring:
- Consistent session validation
- Input sanitization and rate limiting
- Unified error handling
- Optimized structure for scalability

---

## 📈 Planned Improvements

- Add item usage effects
- PvP or attack logic
- Admin panel for moderation
- Transaction logs and audit dashboard
- Enhanced WebSocket moderation (rate limits, mute, profanity filter)

---

## 📜 License

This project is open-source and MIT licensed.
