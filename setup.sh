#!/bin/bash
# MextJS Setup Helper Script
# This script automates the initial setup of MextJS

set -e

echo "🚀 MextJS Setup Helper"
echo "====================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Visit: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm --version)${NC}"

# Check MySQL (optional, can be Docker)
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✓ MySQL is installed${NC}"
else
    echo -e "${YELLOW}⚠ MySQL not found locally (can use Docker)${NC}"
fi

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ Git is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git $(git --version | awk '{print $3}')${NC}"

echo ""
echo "✅ Prerequisites check complete"
echo ""

# Backend Setup
echo "📦 Setting up Backend..."
cd backend
echo "Installing dependencies..."
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠ Created .env file - please update with your MySQL credentials${NC}"
    echo "Open: backend/.env"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

cd ..
echo ""

# Frontend Setup
echo "📦 Setting up Frontend..."
cd frontend
echo "Installing dependencies..."
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✓ Created .env.local file${NC}"
else
    echo -e "${GREEN}✓ .env.local file exists${NC}"
fi

cd ..
echo ""

echo "✅ Setup complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Update backend/.env with your MySQL credentials"
echo "2. Create MySQL database: CREATE DATABASE mextjs;"
echo "3. Start backend: cd backend && npm run dev"
echo "4. In new terminal, start frontend: cd frontend && npm run dev"
echo "5. Open http://localhost:3001 in your browser"
echo ""
echo "📚 Documentation:"
echo "- Quick Start:  QUICK_START.md"
echo "- Full Guide:   README.md"
echo "- API Docs:     API_REFERENCE.md"
echo "- Deployment:   DEPLOYMENT.md"
echo ""
echo "🎉 Happy Coding!"
