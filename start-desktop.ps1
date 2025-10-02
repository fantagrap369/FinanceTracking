# Finance Tracker - Desktop Startup Script
# This script starts both the backend server and web app

Write-Host "🚀 Starting Finance Tracker Desktop..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Initialize data if it doesn't exist
Write-Host "📊 Initializing data..." -ForegroundColor Yellow
if (-not (Test-Path "data")) {
    node setup-local-data.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to initialize data" -ForegroundColor Red
        exit 1
    }
}

# Start backend server
Write-Host "🔧 Starting backend server on port 3001..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server/index.js" -WorkingDirectory (Get-Location)

# Wait a moment for server to start
Start-Sleep -Seconds 2

# Start web app
Write-Host "🌐 Starting web app on port 3000..." -ForegroundColor Yellow
Set-Location "web"
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "start" -WorkingDirectory (Get-Location)

# Go back to root
Set-Location ".."

Write-Host "✅ Desktop services started!" -ForegroundColor Green
Write-Host "🌐 Web App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 API Server: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📊 Health Check: http://localhost:3001/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow

# Keep script running and monitor processes
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if processes are still running
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses.Count -eq 0) {
            Write-Host "⚠️  No Node.js processes found. Services may have stopped." -ForegroundColor Yellow
            break
        }
    }
} catch {
    Write-Host "🛑 Stopping services..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ All services stopped." -ForegroundColor Green
}
