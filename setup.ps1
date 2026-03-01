# Asad's Inventory - Quick Start

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Asad's Inventory" -ForegroundColor Cyan
Write-Host "  Quick Start Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check MySQL
Write-Host "Checking MySQL installation..." -ForegroundColor Yellow
try {
    $mysqlVersion = mysql --version
    Write-Host "✓ MySQL installed" -ForegroundColor Green
} catch {
    Write-Host "✗ MySQL not found. Please install MySQL first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 1: Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$dbSetup = Read-Host "Do you want to set up the database now? (y/n)"
if ($dbSetup -eq "y") {
    Write-Host "Please enter your MySQL credentials:" -ForegroundColor Yellow
    $mysqlUser = Read-Host "MySQL Username (default: root)"
    if ([string]::IsNullOrWhiteSpace($mysqlUser)) {
        $mysqlUser = "root"
    }
    
    Write-Host "Running database setup script..." -ForegroundColor Yellow
    mysql -u $mysqlUser -p < backend/config/database.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database setup completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Database setup failed. Please check your credentials." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 2: Backend Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location backend
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install

if (!(Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠ Please edit backend/.env with your database credentials!" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

Write-Host "✓ Backend setup completed!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Step 3: Frontend Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location ../frontend
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install

Write-Host "✓ Frontend setup completed!" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Default Login Credentials:" -ForegroundColor Cyan
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host "  1. Backend:  cd backend && npm run dev" -ForegroundColor White
Write-Host "  2. Frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

$startNow = Read-Host "Do you want to start the servers now? (y/n)"
if ($startNow -eq "y") {
    Write-Host ""
    Write-Host "Starting servers..." -ForegroundColor Yellow
    Write-Host "Backend will open in a new window..." -ForegroundColor Cyan
    
    # Start backend in new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"
    
    Start-Sleep -Seconds 3
    
    # Start frontend in current window
    Write-Host "Starting frontend..." -ForegroundColor Cyan
    Set-Location frontend
    npm run dev
}
