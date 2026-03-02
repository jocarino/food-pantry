#!/bin/bash

echo "============================================"
echo "Restarting Food Pantry App"
echo "============================================"
echo ""

# Kill existing processes
echo "1. Stopping existing processes..."
pkill -f "expo start" 2>/dev/null
pkill -f "react-native start" 2>/dev/null
pkill -f "node.*metro" 2>/dev/null
sleep 2

# Clear caches
echo "2. Clearing caches..."
cd app
rm -rf .expo
rm -rf node_modules/.cache
echo "   ✓ Cache cleared"

# Verify environment variables
echo "3. Checking environment variables..."
if [ -f .env ]; then
    if grep -q "EXPO_PUBLIC_GEMINI_API_KEY" .env; then
        echo "   ✓ Gemini API key found in .env"
    else
        echo "   ✗ Gemini API key NOT found in .env"
        echo "   Add this line to app/.env:"
        echo "   EXPO_PUBLIC_GEMINI_API_KEY=your_key_here"
    fi
else
    echo "   ✗ .env file not found"
    echo "   Create app/.env with:"
    echo "   EXPO_PUBLIC_GEMINI_API_KEY=your_key_here"
fi

# Check Supabase keys
if grep -q "EXPO_PUBLIC_SUPABASE_URL" .env; then
    echo "   ✓ Supabase URL found"
else
    echo "   ✗ Supabase URL NOT found"
fi

if grep -q "EXPO_PUBLIC_SUPABASE_ANON_KEY" .env; then
    echo "   ✓ Supabase Anon Key found"
else
    echo "   ✗ Supabase Anon Key NOT found"
fi

echo ""
echo "4. Starting app with fresh environment..."
echo ""
echo "Run this command:"
echo "   cd app && npm start"
echo ""
echo "Then press 'w' to open in web browser"
echo ""
echo "============================================"
