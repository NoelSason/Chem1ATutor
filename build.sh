#!/bin/bash

# Build script to inject Gemini API key from environment variable
# This runs on Vercel during deployment

echo "Injecting Gemini API key from environment variable..."

# Create gemini-config.js from environment variable
cat > gemini-config.js << EOF
// Auto-generated gemini-config.js from environment variable
// DO NOT commit this file to Git
const GEMINI_CONFIG = {
    apiKey: '${GEMINI_API_KEY}'
};
EOF

echo "✅ gemini-config.js created successfully"
