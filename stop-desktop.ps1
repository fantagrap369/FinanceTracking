# Finance Tracker - Stop Desktop Services
# This script stops all running Node.js processes

Write-Host "🛑 Stopping Finance Tracker Desktop services..." -ForegroundColor Yellow

# Stop all Node.js processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses.Count -gt 0) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es), stopping..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ All services stopped." -ForegroundColor Green
} else {
    Write-Host "ℹ️  No Node.js processes found." -ForegroundColor Blue
}

Write-Host "🏁 Desktop services stopped." -ForegroundColor Green
