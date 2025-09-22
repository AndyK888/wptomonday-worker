#!/bin/bash

# Deployment script for WordPress to Monday.com Worker
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}

echo "🚀 Deploying WordPress to Monday.com Worker to $ENVIRONMENT"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please log in to Cloudflare:"
    wrangler login
fi

# Validate the worker code
echo "🔍 Validating JavaScript syntax..."
node -c index.js
echo "✅ JavaScript syntax is valid"

# Check environment variables
echo "🔧 Checking environment variables..."

# Check if secrets are set (this will show which ones are missing)
echo "📋 Current secrets:"
wrangler secret list --env $ENVIRONMENT || echo "⚠️  No secrets found. You may need to set them."

echo ""
echo "🔑 Required secrets:"
echo "  - MONDAY_API_TOKEN (your Monday.com API token)"
echo "  - MONDAY_BOARD_ID (your Monday.com board ID)"
echo "  - MONDAY_COLUMN_MAPPING (optional - JSON mapping of form fields to columns)"
echo ""

read -p "Do you want to set/update secrets now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Setting MONDAY_API_TOKEN..."
    wrangler secret put MONDAY_API_TOKEN --env $ENVIRONMENT
    
    echo "Setting MONDAY_BOARD_ID..."
    wrangler secret put MONDAY_BOARD_ID --env $ENVIRONMENT
    
    read -p "Do you want to set MONDAY_COLUMN_MAPPING? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Setting MONDAY_COLUMN_MAPPING..."
        echo "Example: {\"name\":\"name\",\"email\":\"lead_email\",\"phone\":\"lead_phone\",\"location\":\"text_mkvqtqf7\"}"
        wrangler secret put MONDAY_COLUMN_MAPPING --env $ENVIRONMENT
    fi
fi

# Deploy
echo "🚀 Deploying to Cloudflare Workers..."
if [ "$ENVIRONMENT" = "production" ]; then
    wrangler deploy --env production
else
    wrangler deploy --env $ENVIRONMENT
fi

# Get the deployment URL
WORKER_URL=$(wrangler subdomain 2>/dev/null | grep -o 'https://[^[:space:]]*' || echo "https://wptomonday.your-subdomain.workers.dev")

echo ""
echo "✅ Deployment completed!"
echo "🔗 Worker URL: $WORKER_URL"
echo ""
echo "🧪 Test your deployment:"
echo "  curl $WORKER_URL/"
echo "  curl $WORKER_URL/health"
echo ""
echo "📚 Next steps:"
echo "  1. Test the worker endpoints"
echo "  2. Configure your WordPress Contact Form 7 webhook"
echo "  3. Set up your Monday.com board and columns"
echo "  4. Test the integration end-to-end"
echo ""

# Offer to run tests
read -p "Do you want to run basic tests now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v node &> /dev/null; then
        echo "🧪 Running tests..."
        node test-worker.js "$WORKER_URL"
    else
        echo "❌ Node.js not found. Please run tests manually:"
        echo "  node test-worker.js $WORKER_URL"
    fi
fi
