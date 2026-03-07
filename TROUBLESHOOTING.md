# Troubleshooting Guide - WPAnyWhere

Comprehensive guide to solve common issues in WPAnyWhere.

---

## 🔧 Installation Issues

### Error: "Cannot find module 'mysql2'"

**Cause:** Dependencies not installed

**Solution:**
```bash
cd backend
npm install
npm list mysql2  # Verify installation
```

### Error: "npm ERR! code ERESOLVE"

**Cause:** Dependency conflict

**Solution:**
```bash
# Use legacy peer dependencies flag
npm install --legacy-peer-deps

# Or upgrade npm
npm install -g npm@latest
```

### Error: "node: command not found"

**Cause:** Node.js not installed properly

**Solution:**
```bash
# Check Node version
node --version

# If not installed:
# Visit: https://nodejs.org/
# Download LTS version
# Install and restart terminal
```

---

## 🗄️ Database Issues

### Error: "Access denied for user 'root'@'localhost'"

**Cause:** Wrong MySQL credentials

**Solution:**
```bash
# Check your .env file
cat .env

# Verify MySQL credentials:
mysql -u root -p
# Enter your password

# Check if database exists:
SHOW DATABASES;
SHOW DATABASES LIKE 'mextjs';
```

### Error: "database mextjs does not exist"

**Cause:** Database not created

**Solution:**
```bash
# Create database
mysql -u root -p
CREATE DATABASE mextjs;
exit

# Verify
mysql -u root -p -e "SHOW DATABASES;"
```

### Error: "PROTOCOL_SEQUENCE_TIMEOUT"

**Cause:** MySQL connection timeout

**Solution:**
```javascript
// backend/config/database.js - Update pool settings:
pool: {
  max: 5,
  min: 0,
  acquire: 30000,
  idle: 10000,
  evict: 30000,  // Add this
}
```

### Error: "MySQL has gone away"

**Cause:** Idle connection closed

**Solution:**
```bash
# Restart MySQL
sudo systemctl restart mysql

# Or update config with ping:
const sequelize = new Sequelize(..., {
  pool: {
    validate: () => {
      // Connection will be validated before use
      return true;
    },
  },
});
```

---

## 🔌 Backend Issues

### Error: "EADDRINUSE: address already in use :::3000"

**Cause:** Port 3000 already in use

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000                    # macOS/Linux
netstat -ano | findstr :3000     # Windows

# Kill process
kill -9 <PID>                    # macOS/Linux
taskkill /PID <PID> /F           # Windows

# Or change port in .env
PORT=3001
```

### Error: "Cannot find module whatsapp-web.js"

**Cause:** Library not installed

**Solution:**
```bash
cd backend
npm install whatsapp-web.js
npm list whatsapp-web.js

# If still failing, try:
npm install --no-save whatsapp-web.js
```

### Error: "Puppeteer is not installed"

**Cause:** Chromium not available

**Solution:**
```bash
# whatsapp-web.js includes Puppeteer, reinstall:
npm install whatsapp-web.js --force

# Or install Chromium dependencies (Linux):
sudo apt-get install -y libgconf-2-4 libatk1.0-0 libatk-bridge2.0-0 ...
```

### Error: "Browser was not found at the configured executablePath"

**Cause:** Puppeteer's bundled Chromium is missing or corrupted (e.g. at `~/.cache/puppeteer/chrome/...`)

**Solution:**
```bash
cd backend

# Option 1: Re-download Puppeteer's Chromium
npx puppeteer browsers install chrome

# Option 2: Use system Chrome - install Google Chrome, then set path (optional):
# Windows: Chrome at C:\Program Files\Google\Chrome\Application\chrome.exe
# The app auto-detects system Chrome if Puppeteer's path is missing.

# Option 3: Custom Chrome path via env
set CHROME_PATH=C:\Path\To\chrome.exe   # Windows
# export CHROME_PATH=/usr/bin/google-chrome   # Linux
```

### Error: "localhost:3000 connection refused"

**Cause:** Backend server not running

**Solution:**
```bash
# Check if server is running
curl http://localhost:3000/health

# Start server
cd backend
npm run dev

# Check for startup errors in terminal
```

### Error: "CORS policy: Cross-origin request blocked"

**Cause:** Frontend and backend domains don't match

**Solution:**
```javascript
// backend/app.js - Update CORS:
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));

// .env
CORS_ORIGIN=http://localhost:3001
```

### Error: "Invalid JWT token"

**Cause:** Token expired or corrupted

**Solution:**
```javascript
// backend/middlewares/auth.middleware.js
const decoded = jwt.verify(token, JWT_SECRET, {
  algorithms: ['HS256'],
});

// Check token expiry time and refresh
localStorage.removeItem('token');
// User needs to login again
```

---

## 📱 Frontend Issues

### Error: "React is not defined"

**Cause:** React not imported

**Solution:**
```javascript
// Add to top of file
import React from 'react';

// Or in Next.js (usually auto-imported)
```

### Error: "Module not found: next/image"

**Cause:** Outdated Next.js version

**Solution:**
```bash
cd frontend
npm install next@latest react@latest react-dom@latest
```

### Error: "Tailwind CSS styles not applying"

**Cause:** Tailwind not configured

**Solution:**
```bash
# Check tailwind.config.js exists
ls tailwind.config.js

# Rebuild CSS
npm run build

# Clear Next.js cache
rm -rf .next
npm run dev
```

### Error: "localhost:3001 refused to connect"

**Cause:** Frontend server not running

**Solution:**
```bash
cd frontend
npm install
npm run dev

# Check for errors
```

### Error: "Cannot read property 'push' of undefined"

**Cause:** useRouter not used correctly

**Solution:**
```javascript
import { useRouter } from 'next/router';

export default function Component() {
  const router = useRouter();
  
  // Use router.push()
  router.push('/dashboard');
}

// Make sure it's pages/*, not other directories
```

---

## 🔐 Authentication Issues

### Error: "Invalid credentials"

**Cause:** Wrong email or password

**Solution:**
```bash
# Double-check credentials
# Passwords are case-sensitive
# Email must be registered first

# Reset password (if implemented):
1. Go to login page
2. Click "Forgot Password"
3. Follow email link
```

### Error: "Email already registered"

**Cause:** Email already exists in database

**Solution:**
```bash
# Use different email OR
# Reset database if in development:

mysql -u root -p mextjs
TRUNCATE TABLE users;
exit

# Then register with same email
```

### Error: "Token is missing" (401)

**Cause:** No JWT token in request

**Solution:**
```javascript
// Check if token is stored:
console.log(localStorage.getItem('token'));
console.log(document.cookie);

// Ensure it's sent with each request:
// backend/services/api.js already handles this with interceptor
```

---

## 🟢 WhatsApp Connection Issues

### Issue: "WhatsApp QR code not generating"

**Cause:** Client initialization failed

**Solution:**
```bash
1. Clear browser console errors
2. Check backend logs for errors
3. Restart backend: npm run dev
4. Try again - click "Initialize WhatsApp"
5. Keep page open and scan quickly

# If still failing:
rm -rf backend/sessions/user-*
npm run dev
# Try again from scratch
```

### Issue: "QR code keeps refreshing"

**Cause:** Waiting for scan

**Solution:**
```
1. On your phone, open WhatsApp
2. Go to Settings > Linked Devices
3. Tap "Link a Device"
4. Scan the QR code on screen (within 30 seconds)
5. Confirm on phone
6. Wait for "Connected" status
```

### Issue: "WhatsApp disconnects after a few minutes"

**Cause:** Connection timeout or session lost

**Solution:**
```javascript
// backend/services/whatsapp.service.js
// Already has reconnection logic, but you can:

1. Keep page open (don't close browser)
2. Keep phone nearby
3. Check phone battery
4. Ensure good internet connection
5. Disconnect and reconnect if needed
```

### Issue: "Message delivery failed"

**Cause:** WhatsApp not connected or network issue

**Solution:**
```bash
# Check status first:
GET /whatsapp/status

# Should return: "connected"

# If disconnected:
1. Reload page
2. Re-scan QR code
3. Try sending again

# For number format issues:
# Use format: "919999999999" (country code + number)
# Not: "+919999999999" (no +)
# Not: "9999999999" (missing country code)
```

---

## 🐳 Docker Issues

### Error: "docker: command not found"

**Cause:** Docker not installed

**Solution:**
```bash
# Install Docker:
# Visit: https://www.docker.com/products/docker-desktop

# Verify installation:
docker --version
docker-compose --version
```

### Error: "Cannot connect to Docker daemon"

**Cause:** Docker service not running

**Solution:**
```bash
# Start Docker desktop application
# Or on Linux:
sudo systemctl start docker
```

### Error: "Port 3000 already allocated"

**Cause:** Port already in use

**Solution:**
```bash
# Stop existing containers:
docker-compose down

# Or change port in docker-compose.yml:
ports:
  - "3002:3000"  # Use 3002 instead
```

### Error: "Database connection refused"

**Cause:** MySQL service not ready

**Solution:**
```bash
# Wait for MySQL to start:
docker-compose up -d mysql
docker-compose logs mysql

# Then start other services:
docker-compose up -d backend frontend
```

---

## 🔍 Performance Issues

### Issue: "Slow page load"

**Cause:** Multiple reasons possible

**Solution:**
```javascript
// 1. Check network tab in DevTools
// 2. Minimize API requests
// 3. Add caching:

// frontend/services/api.js
api.interceptors.response.use(response => {
  // Cache successful responses
  return response;
});

// 4. Optimize images
<Image src="..." loading="lazy" />

// 5. Code splitting
import dynamic from 'next/dynamic';
const Heavy = dynamic(() => import('../components/Heavy'), { ssr: false });
```

### Issue: "High CPU usage"

**Cause:** Inefficient code or infinite loops

**Solution:**
```bash
# Monitor processes:
top               # macOS/Linux
Task Manager      # Windows

# Check backend logs for errors
```

### Issue: "Memory leak"

**Cause:** Unreleased resources

**Solution:**
```javascript
// 1. Clean up intervals:
useEffect(() => {
  const interval = setInterval(...);
  return () => clearInterval(interval);
}, []);

// 2. Close database connections properly
// 3. Monitor with:
// Node: node --inspect
// Chrome: chrome://inspect
```

---

## 📝 Logging & Debugging

### Enable Debug Logs

**Backend:**
```bash
DEBUG=* npm run dev
NODE_DEBUG=* npm run dev
```

**Frontend:**
```javascript
// Add to components:
console.log('Debug info:', data);
console.error('Error:', error);

// Or use React DevTools
```

### Check Logs

**Backend logs:**
```bash
# View all logs
tail -f output.log

# View specific logs
grep "Error" output.log
```

**Browser console:**
```javascript
// F12 in browser
// Check Console tab for errors
// Check Network tab for API calls
```

---

## 🆘 Getting More Help

### Collect Debug Information

When asking for help, provide:
```
1. Error message (complete)
2. Stack trace
3. Steps to reproduce
4. Environment:
   - Node.js version
   - npm version
   - Operating system
   - MySQL version
5. Relevant code
6. Screenshots/logs
```

### Contact Support

- **Email:** support@mextjs.com
- **Issues:** GitHub Issues
- **Discord:** Join our community
- **Stack Overflow:** Tag with #mextjs

---

## ✅ Common Solutions Checklist

- [ ] Restarted all services
- [ ] Cleared browser cache
- [ ] Checked .env file
- [ ] Ran `npm install`
- [ ] Verified database connectivity
- [ ] Checked error logs
- [ ] Restarted MySQL
- [ ] Cleared /sessions folder
- [ ] Checked port availability
- [ ] Tried on different browser
- [ ] Updated all dependencies
- [ ] Checked firewall settings

---

Last Updated: 2026-02-05
