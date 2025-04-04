#!/bin/bash

# Edison - Development Environment Script
# This script helps set up and run the development environment for the Edison application

# Exit on error
set -e

echo "=== Edison Development Environment ==="
echo "This script will help you set up and run the development environment for the Edison application."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install it first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "Node.js version 14 or higher is required. Please upgrade Node.js."
    echo "Current version: $(node -v)"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install it first."
    exit 1
fi

# Check if Angular CLI is installed
if ! command -v ng &> /dev/null; then
    echo "Angular CLI is not installed. Installing now..."
    npm install -g @angular/cli
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed. Installing now..."
    npm install -g firebase-tools
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if Firebase project is set up
if [ ! -f ".firebaserc" ]; then
    echo "Firebase project is not set up. Please run scripts/setup-firebase.sh first."
    exit 1
fi

# Start Firebase emulators
echo "Starting Firebase emulators..."
firebase emulators:start --only firestore,functions,auth,hosting &
FIREBASE_PID=$!

# Wait for emulators to start
echo "Waiting for emulators to start..."
sleep 10

# Start Meilisearch if it's installed
if command -v meilisearch &> /dev/null; then
    echo "Starting Meilisearch..."
    meilisearch --http-addr 127.0.0.1:7700 &
    MEILISEARCH_PID=$!
else
    echo "Meilisearch is not installed. Skipping..."
    echo "To install Meilisearch locally, visit: https://docs.meilisearch.com/learn/getting_started/installation.html"
    echo "Alternatively, you can set up Meilisearch on AWS using scripts/setup-meilisearch-aws.sh"
fi

# Start Angular development server
echo "Starting Angular development server with SSR..."
npm run dev:ssr

# Cleanup function
cleanup() {
    echo "Shutting down services..."
    if [ -n "$FIREBASE_PID" ]; then
        kill $FIREBASE_PID
    fi
    if [ -n "$MEILISEARCH_PID" ]; then
        kill $MEILISEARCH_PID
    fi
    exit 0
}

# Register cleanup function
trap cleanup EXIT

# Wait for Angular server to exit
wait
