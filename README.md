# WPAnyWhere – WhatsApp Web Messaging Platform

A secure, scalable, production-ready WhatsApp Web JS platform that allows users to create accounts, connect WhatsApp via QR code, manage sessions, and send messages via API.

## 🎯 Features

- ✅ User Authentication (JWT-based)
- ✅ WhatsApp QR Code Connection
- ✅ Session Persistence
- ✅ REST API for Message Sending
- ✅ Admin Dashboard
- ✅ API Key Authentication
- ✅ Secure Password Hashing (bcrypt)
- ✅ ES6+ Codebase
- ✅ Production-Ready Architecture

## 🧱 Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **whatsapp-web.js** - WhatsApp Web client
- **MySQL** - Database
- **Sequelize** - ORM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **Next.js** - React framework
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **QRCode.react** - QR code rendering

## 📋 Prerequisites

- Node.js v18 or higher
- MySQL Server
- npm or yarn
- Git

## 🚀 Installation & Setup

### 1. Clone or Setup Project

```bash
cd d:\whatsapp-webjs-next
```

### 2. Backend Setup

#### 2.1 Install Dependencies

```bash
cd backend
npm install
```

#### 2.2 Configure Database

Create a MySQL database:

```sql
CREATE DATABASE wpanywhere;
```

Update `.env` file with your database credentials:

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=wpanywhere
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRY=7d
```

#### 2.3 Start Backend Server

```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

#### 3.1 Install Dependencies

```bash
cd frontend
npm install
```

#### 3.2 Configure Environment

Update `.env.local` if needed (default is already configured):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

#### 3.3 Start Frontend Server

```bash
npm run dev
```

The frontend will run on `http://localhost:3001`

## 📖 Project Structure

```
wpanywhere/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── jwt.js
│   ├── models/
│   │   ├── index.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── whatsapp.routes.js
│   │   └── api.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── whatsapp.controller.js
│   │   └── message.controller.js
│   ├── services/
│   │   └── whatsapp.service.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── apiKey.middleware.js
│   ├── sessions/
│   │   └── (user sessions stored here)
│   ├── app.js
│   ├── server.js
│   └── .env
│
├── frontend/
│   ├── pages/
│   │   ├── _app.js
│   │   ├── _document.js
│   │   ├── login.js
│   │   ├── register.js
│   │   ├── dashboard.js
│   │   └── whatsapp.js
│   ├── components/
│   │   ├── Navbar.js
│   │   └── QRCodeBox.js
│   ├── services/
│   │   ├── api.js
│   │   └── useAuth.js
│   ├── styles/
│   │   └── globals.css
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.local
│
└── README.md
```

## 🔐 Authentication

### User Registration

**Endpoint:** `POST /auth/register`

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "confirmPassword": "securepassword"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "api_key": "wpaw_xxxxxxxxxxxxx"
  }
}
```

### User Login

**Endpoint:** `POST /auth/login`

```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "api_key": "wpaw_xxxxxxxxxxxxx",
    "whatsapp_status": "disconnected"
  }
}
```

## 📲 WhatsApp Integration

### Get QR Code

**Endpoint:** `GET /whatsapp/qr`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "qr": "data:image/png;base64,..."
}
```

### Initialize WhatsApp

**Endpoint:** `POST /whatsapp/initialize`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

### Get WhatsApp Status

**Endpoint:** `GET /whatsapp/status`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "success": true,
  "status": "connected" // or "disconnected"
}
```

### Disconnect WhatsApp

**Endpoint:** `POST /whatsapp/disconnect`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

## 📤 Messaging API

### Send Message

**Endpoint:** `POST /api/send`

**Headers:**
```
x-api-key: {USER_API_KEY}
```

**Body:**
```json
{
  "number": "919999999999",
  "message": "Hello from WPAnyWhere"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

### Test Message

**Endpoint:** `POST /api/test`

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Body:**
```json
{
  "message": "Test message content"
}
```

## 🖥️ Frontend Pages

### Login Page (`/login`)
- User login form
- Link to register page
- JWT token storage

### Register Page (`/register`)
- User registration form
- Automatic API key generation
- Link to login page

### Dashboard (`/dashboard`)
- User profile information
- API key display and copy functionality
- WhatsApp connection status
- Test message sending
- Quick links to WhatsApp connection page

### WhatsApp Page (`/whatsapp`)
- Connection status display
- QR code display for scanning
- Initialize WhatsApp button
- Disconnect button
- Connection instructions

## 🔄 Session Persistence

Sessions are automatically saved in:
```
backend/sessions/user-{id}/
```

When the server restarts, sessions are automatically reconnected using the LocalAuth strategy.

## 🛠️ API Usage Examples

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

**Send Message (using API key):**
```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "x-api-key: wpaw_xxxxxxxxxxxxx" \
  -d '{
    "number": "919999999999",
    "message": "Hello from WPAnyWhere"
  }'
```

### Using JavaScript (Axios)

```javascript
import { authAPI, messageAPI, whatsappAPI } from './services/api';

// Register
const registerResponse = await authAPI.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  confirmPassword: 'password123',
});

// Send Message
const messageResponse = await messageAPI.sendMessage(
  {
    number: '919999999999',
    message: 'Hello from WPAnyWhere',
  },
  apiKey
);
```

## 📊 Database Schema

### Users Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password | VARCHAR(255) | NOT NULL |
| api_key | VARCHAR(255) | NOT NULL, UNIQUE |
| whatsapp_status | ENUM('connected', 'disconnected') | DEFAULT: 'disconnected' |
| created_at | TIMESTAMP | DEFAULT: NOW |
| updated_at | TIMESTAMP | DEFAULT: NOW |

## 🔒 Security Best Practices

1. **Never commit .env files** - Use `.env.example` template
2. **Use HTTPS in production** - Always use TLS/SSL
3. **Rotate JWT_SECRET** - Change in production
4. **Validate all inputs** - Server-side validation is essential
5. **Use secure cookies** - HttpOnly, Secure, SameSite flags
6. **Rate limiting** - Implement to prevent abuse
7. **CORS configuration** - Restrict to trusted domains

## ⚙️ Environment Setup for Production

1. **Database:** Use a managed database service (AWS RDS, Azure Database)
2. **Backend:** Deploy on Node.js hosting (Heroku, Railway, AWS EC2)
3. **Frontend:** Deploy on Vercel or similar (Next.js optimized)
4. **Email:** Configure for password reset functionality
5. **Monitoring:** Set up error tracking (Sentry)
6. **Logging:** Configure centralized logging

## 🐛 Troubleshooting

### WhatsApp Connection Issues
- Ensure your phone is connected to the internet
- Try disconnecting and reconnecting
- Clear browser cache
- Check if WhatsApp was recently updated

### Database Connection Error
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists
- Review MySQL error logs

### CORS Errors
- Check `CORS_ORIGIN` in `.env`
- Verify frontend URL matches configuration
- Clear browser cookies and cache

### QR Code Not Displaying
- Check browser console for errors
- Verify API is returning QR data
- Try refreshing the page
- Check network tab for failed requests

## 📚 API Documentation

Full API documentation is available at:
```
http://localhost:3000/api/docs (if Swagger configured)
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 💬 Support

For support, email support@wpanywhere.com or open an issue on GitHub.

## 🎉 Acknowledgments

- [whatsapp-web.js](https://github.com/pedrosans/whatsapp-web.js)
- [Express.js](https://expressjs.com/)
- [Next.js](https://nextjs.org/)
- [Sequelize](https://sequelize.org/)

---

**WPAnyWhere - Making WhatsApp Integration Simple** 🚀
#   w h a t s a p p  
 