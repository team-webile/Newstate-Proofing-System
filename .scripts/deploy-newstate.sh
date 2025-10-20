#!/bin/bash
set -e

echo "Deployment started ..."

# Discard any local changes before pulling
git reset --hard HEAD

# Pull the latest version of the app
git pull origin main

# Use specific Node.js version
export PATH="/root/.nvm/versions/node/v18.20.8/bin:$PATH"
NODE_VERSION=$(/root/.nvm/versions/node/v18.20.8/bin/node -v)
echo "Using Node.js version: $NODE_VERSION"
 
# Install dependencies with force flag to bypass engine checks
echo "Installing dependencies..."
/root/.nvm/versions/node/v18.20.8/bin/npm install --legacy-peer-deps --force

# Build the application with ignore-engines flag
echo "Building application..."
/root/.nvm/versions/node/v18.20.8/bin/npm run build --ignore-engines

# Restart the PM2 process
pm2 restart client-proofing

echo "Deployment finished!"
