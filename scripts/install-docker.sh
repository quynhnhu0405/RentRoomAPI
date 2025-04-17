#!/bin/bash

# Script to install Docker and Docker Compose on Linux systems
# This is a simplified installer, for detailed instructions visit:
# https://docs.docker.com/engine/install/

echo "RentRoom API - Docker Installation Helper"
echo "========================================"
echo

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    echo "✅ Docker is already installed. Version: $(docker --version)"
else
    echo "Installing Docker..."
    
    # Update package list
    sudo apt-get update
    
    # Install dependencies
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Add current user to the docker group
    sudo usermod -aG docker $USER
    
    echo "✅ Docker installed successfully! You may need to log out and back in for group changes to take effect."
fi

# Check if Docker Compose is already installed
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose is already installed. Version: $(docker-compose --version)"
else
    echo "Installing Docker Compose..."
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo "✅ Docker Compose installed successfully!"
fi

echo
echo "Docker installation complete! You can now run the RentRoom API with Docker:"
echo "  cd RentRoomAPI"
echo "  ./docker-start.sh"
echo 