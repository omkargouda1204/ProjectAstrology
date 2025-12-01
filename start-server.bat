@echo off
REM Kill any existing Node processes on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| find ":3000 " ^| find "LISTENING"') do (
    taskkill /PID %%a /F 2>nul
)

REM Wait a moment for the port to be released
timeout /t 1 /nobreak

REM Start the server
echo Starting Astrology Server...
node server.js
