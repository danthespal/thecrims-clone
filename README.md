# 🕹️ TheCrims Clone — Next.js Full-Stack Game

A full-featured multiplayer game inspired by *TheCrims*, built with a modern tech stack: **Next.js**, **PostgreSQL**, **TailwindCSS**, **TypeScript**, and **WebSocket**.

---

## 🚀 Getting Started

Follow these steps to run **TheCrims Clone** locally:

### 1. 📦 Clone the Repository

```bash
git clone https://github.com/your-username/thecrims-clone.git
cd thecrims-clone
```

### 2. 📁 Install Dependencies

Make sure you have **Node.js (v18+)** and **PostgreSQL** installed.

```bash
npm install
```

### 3. ⚙️ Set Up the Database

Create a PostgreSQL database called `thecrims_clone` (or update the name in `.env`):

```bash
# Connect to PostgreSQL and run:
CREATE DATABASE thecrims_clone;
```

Then, set up your `.env` file:

```env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/thecrims_clone
```

> Replace credentials with your local setup if needed.

### 4. 🛠️ Apply Schema

If you're using `pg`, import the schema manually or run any provided `.sql` dump:

```bash
psql -U postgres -d thecrims_clone < schema.sql
```

> If you're using Prisma (planned): `npx prisma migrate dev` (optional future step)

### 5. ▶️ Run the Dev Server

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

### 6. 🔌 Start WebSocket Server (For Real-Time Chat)

In a new terminal:

```bash
node websocket-server.js
```

Expected output:
```
✅ WebSocket server listening on ws://localhost:4000
```

---

## 📌 Features

- 🧍 User registration, login, and session persistence (7 days)
- 🔐 Secure session handling and rate-limited API access
- 🧪 Full gameplay systems:
  - Robbery system with cooldowns
  - Willpower regeneration
  - Casino (Blackjack, deposit/withdraw)
  - Gear and inventory management
  - Shop system with static items and types
- 💬 Real-time Club Chat with private messaging (WebSocket)
- 🎯 Dynamic dashboard with level/respect progress
- ⚙️ Modular API design (action-based routing)

---

## ⚙️ Tech Stack

| Layer       | Technology                  |
|-------------|-----------------------------|
| Frontend    | Next.js (App Router)        |
| UI          | TailwindCSS + React Context |
| Backend     | REST-like API Routes        |
| DB          | PostgreSQL + pg             |
| Auth        | Custom session cookies      |
| Real-time   | Node.js WebSocket (`ws`)    |
| Typesafety  | TypeScript everywhere       |

---

## 🔐 Authentication

- Custom `session-token` stored in HTTP-only cookie
- 7-day session lifecycle
- Session auto-refresh via `useSession()` hook
- Logout removes session from DB and clears cookie

---

## 🧠 Core Systems

### Robbery
- Cooldown-based actions
- Defined in `robberyConfig.ts`
- Dynamic willpower cost/reward calculations

### Will Regeneration
- Auto-regenerates willpower per minute
- Triggered on session load via `regenWill.ts`

### Casino
- Player wallet and casino wallet separated
- Supports deposits, withdrawals, Blackjack logic
- Tracked via `CasinoTransactions` and `CasinoWallet`

### Gear & Inventory
- Equipment slots and stat-boosting items
- Inventory storage with item quantities
- All managed via centralized gear API

### Items & Shop
- Static item definitions stored server-side
- Buy items using `/api/shop`
- Item data served via `/api/items`

---

## 💬 Club Chat (WebSocket)

Real-time communication with live status and private messaging.

### Features:
- Club-wide messages
- Private messages using `/pm @profile#id message`
- User presence and join/leave announcements
- Online user list updates in real-time

### Running WebSocket Locally:

```bash
# Ensure DATABASE_URL is in .env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/thecrims_clone

# Start the WebSocket server
node websocket-server.js
```

Expected output:
```
✅ WebSocket server listening on ws://localhost:4000
```

---

## ✅ API Quality

This project has undergone a full audit:
- Unified `?action=`-based API structure
- Proper session and input validation
- Centralized error and cooldown management
- Scalable and secure

---

## 🧭 Chat Commands

| Command               | Description                        |
|------------------------|------------------------------------|
| `/pm @user#id msg`    | Send a private message             |
| `/help`               | Show available chat commands       |
| `/r msg`              | Reply to last private message      |

---

## 📈 Planned Improvements

- 🧠 Add item usage logic (e.g., drugs for will restore)
- ⚔️ PvP and attack logic with respect loss/gain
- 👑 Admin panel with mute/ban tools
- 🧾 Transaction log + moderation dashboard
- 🔇 Rate limiting + profanity filter for chat

---

## 📜 License

MIT License. Free to use, fork, and improve.
