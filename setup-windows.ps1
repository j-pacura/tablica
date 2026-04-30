# Setup script for Windows - Tablica Matematyczna
# This script will set up the backend and frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tablica Matematyczna - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Backend setup
Write-Host "[1/5] Setting up Backend..." -ForegroundColor Yellow

if (-Not (Test-Path "backend\.env")) {
    Write-Host "  Creating .env file from .env.example..." -ForegroundColor Green
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "  ✓ .env created" -ForegroundColor Green
} else {
    Write-Host "  .env already exists, skipping..." -ForegroundColor Gray
}

Write-Host ""
Write-Host "[2/5] Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
Write-Host "  ✓ Backend dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Running database migrations..." -ForegroundColor Yellow
npm run migrate
Write-Host "  ✓ Database created" -ForegroundColor Green

Set-Location ..

# Frontend setup
Write-Host ""
Write-Host "[4/5] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "[5/5] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Next steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open TWO PowerShell terminals" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 1 - Backend:" -ForegroundColor Yellow
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 2 - Frontend:" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Open browser: http://localhost:3002" -ForegroundColor White
Write-Host ""
Write-Host "3. Register a new account or use:" -ForegroundColor White
Write-Host "   (Note: test account may not exist, create your own)" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Happy coding! 🚀" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
