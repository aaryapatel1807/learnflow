@echo off
echo ========================================
echo LearnFlow Development Setup
echo ========================================
echo.

REM Check if MongoDB is running
echo Checking MongoDB status...
netstat -an | find ":27017" > nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB is running on port 27017
) else (
    echo ⚠️ MongoDB is not running on port 27017
    echo Please start MongoDB with: mongod
    pause
    exit /b 1
)

REM Navigate to server directory
cd /d "%~dp0server"

REM Check if dependencies are installed
echo.
echo Checking server dependencies...
if exist node_modules (
    echo ✅ Server dependencies are installed
) else (
    echo ⚠️ Installing server dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install server dependencies
        pause
        exit /b 1
    )
)

REM Seed the database
echo.
echo Seeding database...
call npm run seed
if %errorlevel% neq 0 (
    echo ❌ Failed to seed database
    pause
    exit /b 1
)

REM Start the server
echo.
echo Starting LearnFlow API server...
echo Server will run on: http://localhost:5000
echo API documentation: http://localhost:5000/api
echo Health check: http://localhost:5000/api/health
echo.
echo Press Ctrl+C to stop the server
echo ========================================
call npm run dev