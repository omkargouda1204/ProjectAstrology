# Server Startup Guide - Port Conflict Resolution

## ✅ Issue Fixed

**Problem:** EADDRINUSE error - port 3000 already in use
**Solution:** Added automatic port conflict detection and graceful shutdown handling

## How to Start the Server

### Option 1: Using PowerShell Script (Recommended)
```powershell
powershell -ExecutionPolicy Bypass -File "start-server.ps1"
```

**What it does:**
- Automatically kills any existing Node processes
- Waits 2 seconds for the port to be released
- Checks if port 3000 is still in use
- Force-terminates any remaining processes on port 3000
- Starts the server with full error handling

### Option 2: Using Batch Script
```cmd
start-server.bat
```

### Option 3: Manual Startup
```powershell
# Kill existing processes
Get-Process -Name "node" | Stop-Process -Force

# Wait for port to be released
Start-Sleep -Seconds 2

# Start server
node server.js
```

## Server Features

✅ **Automatic Error Handling**
- If port 3000 is in use, automatically tries port 3001
- Graceful shutdown on SIGINT and SIGTERM signals
- Proper error logging

✅ **Background Removal**
- Canvas API fallback for Windows compatibility
- Automatic progress logging (Step 1/3, 2/3, 3/3)
- Transparent PNG generation with `_transparent` suffix

✅ **Database Integration**
- Supabase PostgreSQL integration
- Real-time data from database (reviews, chatbot config)
- Automatic navbar settings updates

## Testing the Server

Once started, test with:

```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing

# API test
Invoke-WebRequest -Uri "http://localhost:3000/api/reviews?active=true" -UseBasicParsing

# Upload test
Invoke-WebRequest -Uri "http://localhost:3000/api/upload/test" -UseBasicParsing
```

## Stopping the Server

Press `Ctrl+C` in the terminal - the server will shutdown gracefully

Or kill process manually:
```powershell
Get-Process -Name "node" | Stop-Process -Force
```

## Port Conflict Troubleshooting

If you still get port conflicts:

1. **Check what's using the port:**
```powershell
Get-NetTCPConnection -LocalPort 3000
```

2. **Kill the process:**
```powershell
Get-Process -Id <PID> | Stop-Process -Force
```

3. **Verify port is free:**
```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count
# Should return 0
```

## Server Configuration

**File:** `server.js`

Recent improvements:
- Lines 113-150: Added `server` object with error handling
- Lines 152-160: EADDRINUSE error handler with port fallback
- Lines 162-180: Graceful shutdown handlers for SIGINT and SIGTERM

**Port:** 3000 (or 3001 if 3000 is in use)
**Environment:** Node.js v20.4.0+

## Environment Variables Required

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
ADMIN_PASSWORD=your_password
PORT=3000 (optional)
CORS_ORIGIN=* (optional)
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 3000 already in use | Run `start-server.ps1` script - handles automatically |
| Sharp module error | Canvas API fallback active - no action needed |
| Server won't start | Check Node.js version: `node --version` should be v14+ |
| Database connection error | Verify SUPABASE_URL and SUPABASE_KEY in .env |

## Server Status

Current Status: ✅ **Running**
- Port: 3000
- Background removal: Canvas API fallback active
- Database: Connected to Supabase
- CORS: Enabled for all origins
- API endpoints: All functional

---

**Last Updated:** December 1, 2025
**Tested With:** Node.js v20.4.0, Windows 10/11
