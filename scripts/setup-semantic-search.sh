#!/bin/bash

# Edison - Semantic Search Setup Script
# This script installs and configures dependencies for the Semantic Search MVP

# Exit on error
set -e

echo "=== Edison Semantic Search Setup ==="
echo "This script will install and configure dependencies for the Semantic Search MVP."
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install Meilisearch client
echo "Installing Meilisearch client..."
npm install meilisearch@0.30.0 --save

# Check if Meilisearch is running locally
echo "Checking if Meilisearch is running locally..."
if curl -s http://localhost:7700/health > /dev/null; then
    echo "Meilisearch is running locally."
else
    echo "Meilisearch is not running locally. Would you like to install and start it? (y/n)"
    read -r install_meilisearch
    
    if [[ $install_meilisearch =~ ^[Yy]$ ]]; then
        echo "Installing Meilisearch..."
        
        # Check operating system
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -L https://install.meilisearch.com | sh
            ./meilisearch --http-addr 127.0.0.1:7700 &
            echo "Meilisearch installed and started on http://localhost:7700"
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            brew install meilisearch
            meilisearch --http-addr 127.0.0.1:7700 &
            echo "Meilisearch installed and started on http://localhost:7700"
        else
            echo "Unsupported operating system. Please install Meilisearch manually:"
            echo "https://docs.meilisearch.com/learn/getting_started/installation.html"
        fi
    else
        echo "Skipping Meilisearch installation. You will need to install and configure it manually."
    fi
fi

# Install other dependencies
echo "Installing other dependencies..."
npm install rxjs@7.5.0 --save

# Update Angular dependencies if needed
echo "Checking Angular dependencies..."
ng update @angular/core @angular/cli --allow-dirty --force

# Create Meilisearch master key
MASTER_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

# Update environment files with Meilisearch configuration
echo "Updating environment files with Meilisearch configuration..."
sed -i.bak "s/YOUR_MEILISEARCH_API_KEY/$MASTER_KEY/g" src/environments/environment.ts
sed -i.bak "s/YOUR_MEILISEARCH_API_KEY/$MASTER_KEY/g" src/environments/environment.prod.ts

echo "=== Setup Complete ==="
echo "Meilisearch Master Key: $MASTER_KEY"
echo ""
echo "To start the application, run:"
echo "npm start"
echo ""
echo "To index sample patents, navigate to the search page and the application will automatically create sample data."
echo ""
echo "For production deployment, make sure to set up Meilisearch on AWS using the setup-meilisearch-aws.sh script."
