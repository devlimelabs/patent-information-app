#!/bin/bash

# Edison - Angular 19 Upgrade Script
# This script upgrades the project from Angular 15 to Angular 19

# Exit on error
set -e

echo "=== Edison Angular 19 Upgrade ==="
echo "This script will upgrade the project from Angular 15 to Angular 19."
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if Angular CLI is installed
if ! command -v ng &> /dev/null; then
    echo "Angular CLI is not installed. Installing latest version..."
    npm install -g @angular/cli@latest
fi

# Install dependencies
echo "Installing dependencies..."
npm install --force

# Update Angular CLI
echo "Updating Angular CLI..."
ng update @angular/cli@19 --create-commits

# Update Angular core and related packages
echo "Updating Angular core and related packages..."
ng update @angular/core@19 --create-commits

# Remove @nguniversal packages
echo "Removing @nguniversal packages..."
npm uninstall @nguniversal/express-engine @nguniversal/builders

# Add Angular SSR
echo "Adding Angular SSR..."
ng add @angular/ssr --create-commits

# Install additional dependencies
echo "Installing additional dependencies..."
npm install --save express@latest
npm install --save-dev @types/express@latest @types/node@latest

# Build the project
echo "Building the project..."
ng build

# Test SSR
echo "Testing SSR..."
ng serve --ssr

echo "=== Upgrade Complete ==="
echo "The project has been upgraded to Angular 19 with the new SSR approach."
echo ""
echo "To run the application with SSR, use:"
echo "ng serve --ssr"
echo ""
echo "To build the application for production, use:"
echo "ng build"
echo ""
echo "To run the production build locally, use:"
echo "node dist/edison/server/main.js"
