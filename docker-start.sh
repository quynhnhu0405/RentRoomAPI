#!/bin/bash

# Script to start the RentRoom API with Docker

echo "Starting RentRoom API with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Start the containers
echo "Starting containers..."
docker-compose up -d

echo ""
echo "RentRoom API is now running!"
echo "API is available at: http://localhost:5000"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop the service: docker-compose down"
echo "" 