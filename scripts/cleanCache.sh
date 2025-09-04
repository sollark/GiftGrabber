#!/bin/bash

# Clean Cache Script for Next.js Development
# This script clears all cache files and resets the development environment

echo "🧹 Starting cache cleanup..."

# Stop any running Next.js processes
echo "🛑 Stopping Next.js processes..."
pkill -f "next dev" 2>/dev/null || echo "No Next.js dev processes found"
pkill -f "next build" 2>/dev/null || echo "No Next.js build processes found"

# Clear Next.js cache
echo "🗂️  Clearing Next.js cache..."
rm -rf .next
echo "✅ Cleared .next directory"

# Clear node_modules cache
echo "📦 Clearing node_modules cache..."
rm -rf node_modules/.cache
echo "✅ Cleared node_modules/.cache"

# Clear npm cache (optional - uncomment if needed)
# echo "🔧 Clearing npm cache..."
# npm cache clean --force
# echo "✅ Cleared npm cache"

# Clear TypeScript cache
echo "📝 Clearing TypeScript cache..."
rm -f tsconfig.tsbuildinfo
echo "✅ Cleared TypeScript build info"

# Clear any log files
echo "📋 Clearing log files..."
rm -rf logs
rm -f *.log
echo "✅ Cleared log files"

# Clear browser-related files (if any)
echo "🌐 Clearing browser cache files..."
rm -rf .vercel
rm -rf .env.local.backup
echo "✅ Cleared browser cache files"

# Optional: Clear all node_modules and reinstall (uncomment if needed)
# echo "🔄 Reinstalling node_modules..."
# rm -rf node_modules
# npm install
# echo "✅ Reinstalled dependencies"

echo ""
echo "🎉 Cache cleanup complete!"
echo ""
echo "To start development:"
echo "  npm run dev"
echo ""
echo "To build the project:"
echo "  npm run build"
echo ""
