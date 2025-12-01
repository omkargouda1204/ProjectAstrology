# Cosmic Astrology Backend - Startup Script
# Run this script to start the development server

Write-Host @"
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🌙 Cosmic Astrology Backend                        ║
║   Starting Development Server...                     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Write-Host "`n⚠️  WARNING: .env file not found!" -ForegroundColor Yellow
    Write-Host "Creating .env from .env.example...`n" -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env file created!" -ForegroundColor Green
        Write-Host "📝 Please edit .env file with your credentials before starting the server.`n" -ForegroundColor Cyan
        Write-Host "Press any key to open .env file in notepad..." -ForegroundColor Cyan
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        notepad .env
        exit
    } else {
        Write-Host "❌ .env.example file not found. Please create .env manually." -ForegroundColor Red
        exit 1
    }
}

# Check if node_modules exists
if (-Not (Test-Path "node_modules")) {
    Write-Host "`n📦 Installing dependencies...`n" -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "`n✅ Dependencies installed successfully!`n" -ForegroundColor Green
}

# Check if PostgreSQL is running
Write-Host "🔍 Checking PostgreSQL connection..." -ForegroundColor Cyan

try {
    # Try to connect to PostgreSQL
    $null = & psql -U postgres -c "SELECT 1;" 2>&1
    Write-Host "✅ PostgreSQL is running`n" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Cannot connect to PostgreSQL" -ForegroundColor Yellow
    Write-Host "Please make sure PostgreSQL is installed and running.`n" -ForegroundColor Yellow
}

# Start the server
Write-Host "🚀 Starting development server...`n" -ForegroundColor Green

# Run npm dev
npm run dev
