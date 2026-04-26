@echo off
title Market Intelligence Platform
color 0A

echo ============================================
echo   Market Intelligence Platform - Launcher
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b 1
)

REM Install Python dependencies
echo [1/4] Installing Python dependencies...
pip install -r requirements.txt --quiet
echo       Done.
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

REM Install frontend dependencies
echo [2/4] Installing frontend dependencies...
cd frontend && npm install --silent 2>nul && cd ..
echo       Done.
echo.

REM Start Backend
echo [3/4] Starting Backend (FastAPI on port 8000)...
start "Market-Intel Backend" cmd /k "python -m uvicorn app.main:app --reload --port 8000"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [4/4] Starting Frontend (Vite on port 5173)...
start "Market-Intel Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo   Both services are starting up!
echo.
echo   Backend API:    http://127.0.0.1:8000
echo   API Docs:       http://127.0.0.1:8000/docs
echo   Frontend App:   http://localhost:5173
echo ============================================
echo.
echo Press any key to close this launcher...
pause >nul
