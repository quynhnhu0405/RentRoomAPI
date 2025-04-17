@echo off
echo Starting RentRoom API with Docker...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

REM Start the containers
echo Starting containers...
docker-compose up -d

echo.
echo RentRoom API is now running!
echo API is available at: http://localhost:5000
echo.
echo To view logs: docker-compose logs -f
echo To stop the service: docker-compose down
echo. 