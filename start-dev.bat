@echo off

echo Starting Backend...
cd backend
start cmd /k npm run dev

echo Starting Frontend...
cd ..
cd frontend
start cmd /k npm run dev

pause
