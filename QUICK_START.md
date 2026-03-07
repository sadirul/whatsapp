# Quick Start Guide - WPAnyWhere

Get WPAnyWhere up and running in 5 minutes!

## ⚡ Super Quick Start

### 1. Install Node & MySQL
```bash
# Node.js from https://nodejs.org/ (v18+)
# MySQL from https://www.mysql.com/downloads/
```

### 2. Create Database
```sql
CREATE DATABASE mextjs;
```

### 3. Backend Setup
```bash
cd backend
npm install
# Edit .env with your MySQL credentials
npm start
# Server runs on http://localhost:3000
```

### 4. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3001
```

### 5. Open Browser
```
http://localhost:3001
```

---

## 🐳 Docker Quick Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access:
- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- MySQL: localhost:3306

---

## 🔑 First Steps

1. **Register** at http://localhost:3001/register
2. **Login** with your credentials
3. **Go to WhatsApp page** and scan QR code with your phone
4. **Copy your API key** from dashboard
5. **Send messages** using the API!

---

## 🧪 Test API with cURL

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!",
    "confirmPassword": "Test123!"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Send Message (use API key from registration response)
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "x-api-key: mext_xxxxxxxxxxxxx" \
  -d '{
    "number": "919999999999",
    "message": "Hello from WPAnyWhere!"
  }'
```

---

## 📝 Environment Variables

### Backend (.env)
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mextjs
JWT_SECRET=your_secret_key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

---

## ❌ Troubleshooting

| Issue | Solution |
|-------|----------|
| `MySQL Connection Error` | Ensure MySQL is running and credentials are correct |
| `Port 3000 Already in Use` | Change PORT in .env or kill the process using the port |
| `CORS Error` | Check CORS_ORIGIN in backend .env |
| `QR Code Not Showing` | Refresh page, check browser console for errors |
| `WhatsApp Disconnects` | Keep the page open until connection is confirmed |

---

## 🚀 Next Steps

1. Deploy to production using Docker
2. Set up HTTPS/SSL certificates
3. Configure database backups
4. Add monitoring and logging
5. Implement rate limiting
6. Add webhook support

---

## 📚 Full Documentation

See [README.md](./README.md) and [API_REFERENCE.md](./API_REFERENCE.md) for complete documentation.

---

**Happy Coding! 🎉**
