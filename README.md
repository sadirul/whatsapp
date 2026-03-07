<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
</p>

<h1 align="center">WPAnyWhere</h1>
<p align="center">
  <strong>WhatsApp Web API Platform</strong> — Connect, manage sessions, and send messages via REST API
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-api">API</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

## ✨ Overview

WPAnyWhere is a production-ready platform that bridges WhatsApp Web with your applications. Create accounts, connect via QR code, persist sessions, and send messages through a clean REST API—with JWT auth, API keys, and a modern dashboard.

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18+
- **MySQL** 8.0+
- **npm** or **yarn**

### 1. Clone & Install

```bash
git clone <repo-url>
cd whatsapp-webjs-next
```

### 2. Database

```sql
CREATE DATABASE mextjs;
```

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env   # Edit with your MySQL credentials
npx puppeteer browsers install chrome   # Required for WhatsApp
npm run dev
```

→ Backend: **http://localhost:3000**

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

→ Frontend: **http://localhost:3001**

### 5. Or use Docker

```bash
docker-compose up -d
```

### 6. Scheduler Worker (optional)

The scheduler uses a **database queue** (`queue_jobs` table). When you create a schedule, a job is enqueued. Run the worker to process jobs:

```bash
cd backend
npm run worker
```

The worker polls the queue every 30s, claims jobs atomically (row lock), and sends messages to all contacts in the group.

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| **Auth** | JWT-based login, bcrypt password hashing |
| **WhatsApp** | QR code connection, session persistence, auto-reconnect |
| **API** | REST endpoints for sending messages |
| **API Keys** | Per-user keys for programmatic access |
| **Dashboard** | Profile, status, test messages |
| **Webhooks** | Optional message forwarding to your URLs |

---

## 🧱 Tech Stack

| Layer | Stack |
|-------|-------|
| **Backend** | Node.js, Express, whatsapp-web.js, Sequelize |
| **Frontend** | Next.js, Tailwind CSS, Socket.IO |
| **Database** | MySQL |
| **Auth** | JWT, bcryptjs |

---

## 📁 Project Structure

```
whatsapp-webjs-next/
├── backend/                 # Express API
│   ├── config/              # DB, JWT config
│   ├── controllers/        # Route handlers
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── services/           # WhatsApp, AI, etc.
│   └── sessions/           # WhatsApp session data
├── frontend/                # Next.js app
│   ├── pages/               # Login, dashboard, WhatsApp
│   └── components/          # UI components
└── docker-compose.yml      # Full stack in Docker
```

---

## 📡 API

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register user |
| `POST` | `/auth/login` | Login, get JWT |

### WhatsApp

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/whatsapp/initialize` | Start session, get QR |
| `GET` | `/whatsapp/status` | Connection status |
| `POST` | `/whatsapp/disconnect` | Disconnect session |

### Messaging

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/send` | `x-api-key` | Send message to number |
| `POST` | `/api/test` | `Bearer JWT` | Send test message |

**Send message example:**

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "x-api-key: wpaw_your_api_key" \
  -d '{"number": "919999999999", "message": "Hello!"}'
```

---

## ⚙️ Environment

**Backend (`.env`):**

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mextjs
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d
CORS_ORIGIN=http://localhost:3001
```

**Frontend (`.env.local`):**

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

---

## 🐳 Deployment

- **Backend:** Node.js hosting (Railway, Render, AWS)
- **Frontend:** Vercel, Netlify
- **Database:** Managed MySQL (PlanetScale, AWS RDS)
- **Full stack:** `docker-compose` for self-hosted

See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Browser not found | `npx puppeteer browsers install chrome` |
| DB connection failed | Check MySQL, `.env`, and DB exists |
| QR not showing | Restart backend, clear sessions |
| CORS errors | Set `CORS_ORIGIN` to frontend URL |

→ Full guide: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 📚 Docs

- [API Reference](API_REFERENCE.md)
- [Quick Start](QUICK_START.md)
- [Deployment](DEPLOYMENT.md)
- [Troubleshooting](TROUBLESHOOTING.md)

---

## 🙏 Credits

- [whatsapp-web.js](https://github.com/pedrosans/whatsapp-web.js) — WhatsApp Web client
- [Express](https://expressjs.com/) · [Next.js](https://nextjs.org/) · [Sequelize](https://sequelize.org/)

---

<p align="center">
  <sub>WPAnyWhere — WhatsApp integration made simple</sub>
</p>
