@echo off
echo ========================================
echo LearnFlow Client Setup
echo ========================================
echo.

REM Navigate to client directory
cd /d "%~dp0client"

REM Check if dependencies are installed
echo Checking client dependencies...
if exist node_modules (
    echo ✅ Client dependencies are installed
) else (
    echo ⚠️ Installing client dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install client dependencies
        pause
        exit /b 1
    )
)

REM Start the client
echo.
echo Starting LearnFlow React client...
echo Client will run on: http://localhost:5173
echo.
echo Press Ctrl+C to stop the client
echo ========================================
call npm run dev