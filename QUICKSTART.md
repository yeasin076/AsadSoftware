# Quick Start Guide

## Prerequisites Check
- ✅ Node.js (v16+)
- ✅ npm
- ✅ MySQL (v8+)

## Quick Setup (Windows PowerShell)

```powershell
# Run the automated setup script
.\setup.ps1
```

## Manual Setup

### 1. Database Setup
```bash
mysql -u root -p < backend/config/database.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## Default Credentials

- **Username:** admin
- **Password:** admin123

## Need Help?

Check the full [README.md](README.md) for detailed documentation.
