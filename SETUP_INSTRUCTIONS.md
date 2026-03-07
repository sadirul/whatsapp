# 🚀 WPAnyWhere - Setup Instructions

## ⚠️ MySQL Database Required

The application needs a MySQL database to run. Choose one of the options below:

---

## Option 1: Using Docker (Recommended - Easiest) ⭐

### Prerequisites
- Docker Desktop installed (https://www.docker.com/products/docker-desktop)

### Steps
```bash
# Go to project root
cd d:\whatsapp-webjs-next

# Start MySQL in Docker and the entire stack
docker-compose up -d

# Wait 30 seconds for MySQL to initialize
# The database will be automatically created!

# Check status
docker-compose logs
```

**Then access:**
- Frontend: http://localhost:3001
- Backend: http://localhost:3000

---

## Option 2: Manual MySQL Installation

### Step 1: Install MySQL

Download from: https://dev.mysql.com/downloads/mysql/

Choose "MySQL Community Server" → Latest version

### Step 2: Set up MySQL

After installation, open Command Prompt and run:

```cmd
mysql -u root -p
```

When prompted for password, press Enter (default is no password) or enter your password.

### Step 3: Create the Database

In MySQL console, run:

```sql
CREATE DATABASE IF NOT EXISTS mextjs;
EXIT;
```

### Step 4: Update Configuration

Edit `backend/.env`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mextjs
JWT_SECRET=super_secret_key_change_in_production
```

### Step 5: Start the Project

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

**Then access:**
- Frontend: http://localhost:3001
- Backend: http://localhost:3000

---

## Option 3: Use MySQL Server Service

If you have MySQL Server running as a Windows Service:

```cmd
# Check if MySQL is running
sc query MySQL80

# If not running, start it
net start MySQL80
```

Then follow the "Manual MySQL Installation" steps above.

---

## ✅ Verify Installation

### Check Backend Connection

```bash
cd backend
npm start
```

Should see:
```
✓ Connected to database
✓ Server running on http://localhost:3000
```

### Check Frontend

```bash
cd frontend
npm run dev
```

Should see:
```
✓ Started development server
✓ Ready on http://localhost:3001
```

---

## 🐛 Troubleshooting

### "Unknown database 'mextjs'"
→ Database not created yet
→ Follow Option 1 (Docker) or Option 2 (Manual) above

### "Connection refused"
→ MySQL not running
→ Use Docker Compose or start MySQL service

### "Access denied for user 'root'"
→ Wrong password in .env file
→ Update DB_PASSWORD in backend/.env

### "Port 3000 already in use"
→ Change PORT in backend/.env
→ Or kill the process using port 3000

---

## 🎯 Recommended Setup

**For Quick Testing:**
```bash
docker-compose up -d
```
This handles everything automatically!

**For Development:**
```bash
# Terminal 1
cd backend
npm install --legacy-peer-deps
npm start

# Terminal 2
cd frontend
npm install --legacy-peer-deps
npm run dev
```

---

## 📚 Next Steps

After setup is complete:

1. Open http://localhost:3001
2. Register a new account
3. Login
4. Connect WhatsApp via QR code
5. Send your first message!

---

For more help, see:
- README.md
- QUICK_START.md
- TROUBLESHOOTING.md
