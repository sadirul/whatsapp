# Development Guide - WPAnyWhere

Guide for developers contributing to or extending WPAnyWhere.

---

## 🛠️ Development Environment Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn
- Git
- IDE (VS Code recommended)

### VS Code Extensions
```
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Thunder Client
- REST Client
- MySQL
- SQLTools
```

### Setup

**1. Clone Repository**
```bash
git clone https://github.com/yourusername/mextjs.git
cd mextjs
```

**2. Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update with your MySQL credentials
nano .env

# Create database
mysql -u root -p
CREATE DATABASE mextjs;
exit

# Start development server
npm run dev

# Server runs with auto-reload on port 3000
```

**3. Frontend Setup**
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Start development server
npm run dev

# Frontend runs on http://localhost:3001
```

---

## 📁 Project Structure Deep Dive

### Backend Structure
```
backend/
├── config/              # Configuration files
│   ├── database.js      # Sequelize config
│   └── jwt.js           # JWT constants
├── models/              # Database models
│   ├── User.js          # User model
│   └── index.js         # Model exports
├── routes/              # API routes
│   ├── auth.routes.js   # Authentication
│   ├── whatsapp.routes.js
│   └── api.routes.js    # Message API
├── controllers/         # Request handlers
│   ├── auth.controller.js
│   ├── whatsapp.controller.js
│   └── message.controller.js
├── services/            # Business logic
│   └── whatsapp.service.js
├── middlewares/         # Custom middlewares
│   ├── auth.middleware.js
│   └── apiKey.middleware.js
├── utils/               # Utility functions
│   └── generateApiKey.js
├── sessions/            # WhatsApp session storage
├── app.js               # Express app setup
├── server.js            # Server entry point
├── package.json
└── .env                 # Environment variables
```

### Frontend Structure
```
frontend/
├── pages/               # Next.js pages (routes)
│   ├── _app.js          # App wrapper
│   ├── _document.js     # HTML document
│   ├── login.js
│   ├── register.js
│   ├── dashboard.js
│   └── whatsapp.js
├── components/          # Reusable components
│   ├── Navbar.js
│   └── QRCodeBox.js
├── services/            # API services
│   ├── api.js           # Axios instance
│   └── useAuth.js       # Auth hook
├── styles/              # CSS files
│   └── globals.css      # Tailwind imports
├── next.config.js       # Next.js config
├── tailwind.config.js   # Tailwind config
├── postcss.config.js    # PostCSS config
├── package.json
└── .env.local          # Environment variables
```

---

## 🔀 Git Workflow

### Branch Naming
```
feature/feature-name
bugfix/bug-name
hotfix/critical-bug
chore/task-name
docs/documentation-update
```

### Commit Messages
```
feat: Add user authentication
fix: Resolve QR code display issue
docs: Update API documentation
style: Format code with Prettier
refactor: Improve database queries
test: Add unit tests for auth
chore: Update dependencies
```

### Example Workflow
```bash
# Create feature branch
git checkout -b feature/add-message-history

# Make changes
# ...

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: Add message history to dashboard"

# Push to remote
git push origin feature/add-message-history

# Create Pull Request on GitHub
```

---

## 🧪 Testing

### Backend Testing

**Setup Jest**
```bash
npm install --save-dev jest supertest
```

**Example Test (tests/auth.test.js)**
```javascript
const request = require('supertest');
const app = require('../app');

describe('Auth Routes', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });
});
```

**Run Tests**
```bash
npm test
```

### Frontend Testing

**Setup Jest + React Testing Library**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

---

## 📝 Adding New Features

### Example: Add Message History

**1. Create Database Model**
```bash
# backend/models/Message.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  recipient: DataTypes.STRING,
  content: DataTypes.TEXT,
  status: {
    type: DataTypes.ENUM('sent', 'delivered', 'read', 'failed'),
    defaultValue: 'sent',
  },
});

User.hasMany(Message, { foreignKey: 'user_id' });
Message.belongsTo(User, { foreignKey: 'user_id' });

export default Message;
```

**2. Create Controller Method**
```bash
# backend/controllers/message.controller.js - Add this:

export const getMessageHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Message.findAndCountAll({
      where: { user_id: userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: messages.rows,
      total: messages.count,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching history' });
  }
};
```

**3. Create API Route**
```bash
# backend/routes/api.routes.js - Add this:
router.get('/history', authMiddleware, messageController.getMessageHistory);
```

**4. Create Frontend Page**
```bash
# frontend/pages/messages.js
import Navbar from '../components/Navbar';
import { useAuth } from '../services/useAuth';
import { messageAPI } from '../services/api';
import { useEffect, useState } from 'react';

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMessages();
  }, [user]);

  const fetchMessages = async () => {
    try {
      const response = await messageAPI.getMessageHistory();
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Message History</h1>
        {/* Render messages */}
      </div>
    </>
  );
}
```

---

## 🔍 Code Style & Linting

### ESLint Configuration
```bash
npm install --save-dev eslint
npx eslint --init
```

### Prettier Configuration
```bash
npm install --save-dev prettier
echo '{ "semi": true, "singleQuote": true, "trailingComma": "es5" }' > .prettierrc
```

### Format Code
```bash
# Format all files
npx prettier --write .

# Lint
npx eslint .
```

---

## 🐛 Debugging

### Backend Debugging
```bash
# Enable debugging
NODE_DEBUG=* npm run dev

# Use debugger
node --inspect server.js

# Chrome DevTools
chrome://inspect
```

### Frontend Debugging
```bash
# Use browser DevTools (F12)
# Next.js has built-in source maps

# React DevTools extension
# Redux DevTools extension
```

---

## 📚 Adding Documentation

### Code Comments
```javascript
/**
 * Generate a unique API key for user
 * @returns {string} Formatted API key with prefix
 * @example
 * const key = generateApiKey(); // mext_abc123...
 */
export const generateApiKey = () => {
  return `mext_${uuidv4().replace(/-/g, '')}`;
};
```

### JSDoc for Functions
```javascript
/**
 * Send a WhatsApp message
 * @param {string} chatId - Recipient chat ID
 * @param {string} message - Message content
 * @throws {Error} If client is not ready
 * @returns {Promise<void>}
 */
```

---

## 🔄 Database Migrations

### Creating a Migration
```bash
# Using Sequelize CLI
npx sequelize-cli migration:generate --name add-user-avatar

# Edit migration file and run
npx sequelize-cli db:migrate

# Rollback if needed
npx sequelize-cli db:migrate:undo
```

---

## 🚀 Performance Optimization

### Backend Optimization
```javascript
// Use connection pooling
const sequelize = new Sequelize(
  // ...
  {
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Add query caching
const cacheMiddleware = (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
};

// Use pagination
const messages = await Message.findAll({
  limit: 50,
  offset: (page - 1) * 50,
});
```

### Frontend Optimization
```javascript
// Image optimization
import Image from 'next/image';

// Code splitting
import dynamic from 'next/dynamic';
const DynamicComponent = dynamic(() => import('../components/Heavy'));

// Lazy loading
<Image src="..." loading="lazy" />
```

---

## 🤝 Contributing Guidelines

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request** with description
6. **Wait for code review**
7. **Merge when approved**

---

## 📞 Getting Help

- **Issues:** Report bugs via GitHub Issues
- **Discussions:** Ask questions in Discussions
- **Email:** support@mextjs.com
- **Docs:** Check README.md and API_REFERENCE.md

---

Last Updated: 2026-02-05
