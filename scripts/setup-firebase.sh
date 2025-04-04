#!/bin/bash

# Edison - Firebase Setup Script
# This script helps set up a Firebase project for the Edison application

# Exit on error
set -e

echo "=== Edison Firebase Setup ==="
echo "This script will help you set up a Firebase project for the Edison application."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed. Installing now..."
    npm install -g firebase-tools
fi

# Login to Firebase
echo "Logging in to Firebase..."
firebase login

# Create a new Firebase project
echo ""
echo "Creating a new Firebase project..."
echo "Please enter a project name (e.g., edison-patent-app):"
read PROJECT_NAME

firebase projects:create $PROJECT_NAME

# Set the default project
echo ""
echo "Setting $PROJECT_NAME as the default project..."
cat > .firebaserc << EOF
{
  "projects": {
    "default": "$PROJECT_NAME"
  }
}
EOF

# Enable required services
echo ""
echo "Enabling required Firebase services..."
firebase --project $PROJECT_NAME firestore:enable
firebase --project $PROJECT_NAME functions:enable
firebase --project $PROJECT_NAME hosting:enable
firebase --project $PROJECT_NAME storage:enable
firebase --project $PROJECT_NAME auth:enable

# Create Firestore indexes
echo ""
echo "Setting up Firestore indexes..."
firebase --project $PROJECT_NAME deploy --only firestore:indexes

# Set up Firestore security rules
echo ""
echo "Setting up Firestore security rules..."
firebase --project $PROJECT_NAME deploy --only firestore:rules

# Create a web app in the Firebase project
echo ""
echo "Creating a web app in the Firebase project..."
APP_ID=$(firebase --project $PROJECT_NAME apps:create WEB edison-web-app --output json | jq -r '.appId')

# Get the Firebase config
echo ""
echo "Getting Firebase configuration..."
CONFIG=$(firebase --project $PROJECT_NAME apps:sdkconfig WEB $APP_ID)

# Extract the configuration values
API_KEY=$(echo $CONFIG | grep -o '"apiKey": "[^"]*' | cut -d'"' -f4)
AUTH_DOMAIN=$(echo $CONFIG | grep -o '"authDomain": "[^"]*' | cut -d'"' -f4)
PROJECT_ID=$(echo $CONFIG | grep -o '"projectId": "[^"]*' | cut -d'"' -f4)
STORAGE_BUCKET=$(echo $CONFIG | grep -o '"storageBucket": "[^"]*' | cut -d'"' -f4)
MESSAGING_SENDER_ID=$(echo $CONFIG | grep -o '"messagingSenderId": "[^"]*' | cut -d'"' -f4)
APP_ID=$(echo $CONFIG | grep -o '"appId": "[^"]*' | cut -d'"' -f4)
MEASUREMENT_ID=$(echo $CONFIG | grep -o '"measurementId": "[^"]*' | cut -d'"' -f4 || echo "")

# Update environment files with Firebase config
echo ""
echo "Updating environment files with Firebase configuration..."

# Update development environment
cat > src/environments/environment.ts << EOF
// Development environment configuration

export const environment = {
  production: false,
  firebase: {
    apiKey: "$API_KEY",
    authDomain: "$AUTH_DOMAIN",
    projectId: "$PROJECT_ID",
    storageBucket: "$STORAGE_BUCKET",
    messagingSenderId: "$MESSAGING_SENDER_ID",
    appId: "$APP_ID",
    measurementId: "$MEASUREMENT_ID"
  },
  meilisearch: {
    host: "http://localhost:7700", // Local development instance
    apiKey: "YOUR_MEILISEARCH_API_KEY"
  },
  patentsView: {
    apiUrl: "https://search.patentsview.org/api/v1/",
    apiKey: "YOUR_PATENTSVIEW_API_KEY"
  },
  epo: {
    apiUrl: "https://ops.epo.org/3.2/",
    clientId: "YOUR_EPO_CLIENT_ID",
    clientSecret: "YOUR_EPO_CLIENT_SECRET"
  }
};
EOF

# Update production environment
cat > src/environments/environment.prod.ts << EOF
// Production environment configuration

export const environment = {
  production: true,
  firebase: {
    apiKey: "$API_KEY",
    authDomain: "$AUTH_DOMAIN",
    projectId: "$PROJECT_ID",
    storageBucket: "$STORAGE_BUCKET",
    messagingSenderId: "$MESSAGING_SENDER_ID",
    appId: "$APP_ID",
    measurementId: "$MEASUREMENT_ID"
  },
  meilisearch: {
    host: "https://your-aws-instance-ip:7700", // AWS Meilisearch instance
    apiKey: "YOUR_MEILISEARCH_API_KEY"
  },
  patentsView: {
    apiUrl: "https://search.patentsview.org/api/v1/",
    apiKey: "YOUR_PATENTSVIEW_API_KEY"
  },
  epo: {
    apiUrl: "https://ops.epo.org/3.2/",
    clientId: "YOUR_EPO_CLIENT_ID",
    clientSecret: "YOUR_EPO_CLIENT_SECRET"
  }
};
EOF

# Set up Firebase Functions
echo ""
echo "Setting up Firebase Functions..."
mkdir -p functions
cd functions

# Initialize package.json for Functions
cat > package.json << EOF
{
  "name": "functions",
  "scripts": {
    "lint": "eslint --ext .js,.ts .",
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "16"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^11.5.0",
    "firebase-functions": "^4.2.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^5.12.0",
    "@typescript-eslint/parser": "^5.12.0",
    "eslint": "^8.9.0",
    "eslint-config-google": "^0.14.0",
    "eslint-plugin-import": "^2.25.4",
    "firebase-functions-test": "^3.0.0",
    "typescript": "^4.9.0"
  },
  "private": true
}
EOF

# Create tsconfig.json for Functions
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017",
    "skipLibCheck": true
  },
  "compileOnSave": true,
  "include": [
    "src"
  ]
}
EOF

# Create src directory for Functions
mkdir -p src

# Create index.ts for Functions
cat > src/index.ts << EOF
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// SSR function for Angular Universal
export const ssr = functions.https.onRequest((request, response) => {
  // This will be implemented later when we set up Angular Universal
  response.send('SSR function will be implemented with Angular Universal');
});

// Function to generate sitemap
export const generateSitemap = functions.pubsub
  .schedule('0 0 * * *') // Run daily at midnight
  .onRun(async () => {
    // This will be implemented later
    console.log('Sitemap generation will be implemented later');
    return null;
  });

// Function to index patents to Meilisearch
export const indexPatentToMeilisearch = functions.firestore
  .document('patents/{patentId}')
  .onWrite(async (change, context) => {
    // This will be implemented later
    console.log('Meilisearch indexing will be implemented later');
    return null;
  });
EOF

cd ..

echo "=== Setup Complete ==="
echo "Firebase project $PROJECT_NAME has been set up successfully."
echo ""
echo "Next steps:"
echo "1. Update the Meilisearch configuration in the environment files"
echo "2. Obtain API keys for PatentsView and EPO OPS"
echo "3. Run 'npm install' to install dependencies"
echo "4. Run 'npm run dev:ssr' to start the development server"
echo ""
echo "To deploy the application, run:"
echo "npm run build:ssr && firebase deploy"
