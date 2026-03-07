@echo off
REM MextJS Setup Helper Script for Windows
REM This script automates the initial setup of MextJS

setlocal enabledelayedexpansion

echo.
echo 🚀 MextJS Setup Helper
echo =====================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✓ Node.js !NODE_VERSION!
) else (
    echo ✗ Node.js is not installed
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✓ npm !NPM_VERSION!
) else (
    echo ✗ npm is not installed
    pause
    exit /b 1
)

REM Check Git
where git >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Git is installed
) else (
    echo ✗ Git is not installed
    pause
    exit /b 1
)

echo.
echo ✅ Prerequisites check complete
echo.

REM Backend Setup
echo 📦 Setting up Backend...
cd backend
echo Installing dependencies...
call npm install
if %ERRORLEVEL% EQU 0 (
    echo ✓ Backend dependencies installed
) else (
    echo ✗ Failed to install backend dependencies
    pause
    exit /b 1
)

REM Check .env file
if not exist .env (
    copy .env.example .env
    echo ⚠ Created .env file - please update with your MySQL credentials
    echo Open: backend\.env
) else (
    echo ✓ .env file exists
)

cd ..
echo.

REM Frontend Setup
echo 📦 Setting up Frontend...
cd frontend
echo Installing dependencies...
call npm install
if %ERRORLEVEL% EQU 0 (
    echo ✓ Frontend dependencies installed
) else (
    echo ✗ Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Check .env.local file
if not exist .env.local (
    copy .env.example .env.local
    echo ✓ Created .env.local file
) else (
    echo ✓ .env.local file exists
)

cd ..
echo.

echo ✅ Setup complete!
echo.
echo 📝 Next Steps:
echo 1. Update backend\.env with your MySQL credentials
echo 2. Create MySQL database: CREATE DATABASE mextjs;
echo 3. Start backend: cd backend ^&^& npm run dev
echo 4. In new terminal, start frontend: cd frontend ^&^& npm run dev
echo 5. Open http://localhost:3001 in your browser
echo.
echo 📚 Documentation:
echo - Quick Start:  QUICK_START.md
echo - Full Guide:   README.md
echo - API Docs:     API_REFERENCE.md
echo - Deployment:   DEPLOYMENT.md
echo.
echo 🎉 Happy Coding!
echo.
pause
