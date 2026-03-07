@echo off

set TZ=Asia/Kolkata

echo Starting Backend...
cd backend
start cmd /k "set TZ=Asia/Kolkata && npm run dev"

echo Starting Frontend...
cd ..
cd frontend
start cmd /k "set TZ=Asia/Kolkata && npm run dev"

echo Starting Scheduler Worker...
cd ..
cd backend
start cmd /k "set TZ=Asia/Kolkata && npm run worker"

pause
