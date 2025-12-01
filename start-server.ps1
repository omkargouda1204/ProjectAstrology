# Kill any existing Node processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait for the process to fully terminate and port to be released
Start-Sleep -Seconds 2

# Check if port 3000 is still in use
$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count

if ($portInUse -gt 0) {
    Write-Host "⚠️  Port 3000 is still in use, attempting force cleanup..." -ForegroundColor Yellow
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
}

# Start the server
Write-Host "🚀 Starting Astrology Server..." -ForegroundColor Green
node server.js
