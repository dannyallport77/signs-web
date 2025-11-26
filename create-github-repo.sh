#!/bin/bash

# Signs NFC Writer - GitHub Repository Setup
# This script helps you create and push to a GitHub repository

echo "🚀 Signs NFC Writer - GitHub Setup"
echo "===================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Please install it first:"
    echo "  brew install gh"
    echo ""
    echo "Or create repository manually at: https://github.com/new"
    echo "Then run:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/signs-nfc-writer.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
    exit 1
fi

echo "Creating GitHub repository..."
echo ""

# Create GitHub repository
gh repo create signs-nfc-writer \
  --public \
  --description "Complete NFC tag management system with mobile app (Expo) and web dashboard (Next.js). Features Google Maps integration, user management, stock control, and NFC writing capabilities." \
  --source=. \
  --remote=origin \
  --push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Repository created and pushed successfully!"
    echo ""
    echo "🌐 View your repository:"
    gh repo view --web
else
    echo ""
    echo "⚠️  Failed to create repository automatically."
    echo ""
    echo "Manual steps:"
    echo "1. Go to: https://github.com/new"
    echo "2. Repository name: signs-nfc-writer"
    echo "3. Description: Complete NFC tag management system with mobile and web apps"
    echo "4. Make it Public"
    echo "5. Don't initialize with README (we already have one)"
    echo "6. Click 'Create repository'"
    echo ""
    echo "Then run these commands:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/signs-nfc-writer.git"
    echo "  git branch -M main"
    echo "  git push -u origin main"
fi
