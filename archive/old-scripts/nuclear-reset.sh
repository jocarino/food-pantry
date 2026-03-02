#!/bin/bash

echo "🔥 ================================="
echo "🔥 NUCLEAR RESET - KILL EVERYTHING"
echo "🔥 ================================="
echo ""

# Kill all processes
echo "1. Killing all Expo/Metro/Node processes..."
pkill -9 -f "expo" 2>/dev/null && echo "   ✓ Killed expo"
pkill -9 -f "metro" 2>/dev/null && echo "   ✓ Killed metro"
pkill -9 -f "react-native" 2>/dev/null && echo "   ✓ Killed react-native"
pkill -9 -f "node.*8081" 2>/dev/null && echo "   ✓ Killed node on port 8081"

sleep 2

# Check if anything still running
REMAINING=$(ps aux | grep -E "expo|metro|8081" | grep -v grep)
if [ -z "$REMAINING" ]; then
    echo "   ✓ All processes killed"
else
    echo "   ⚠ Some processes still running:"
    echo "$REMAINING"
fi

echo ""

# Clear all caches
echo "2. Clearing all caches..."
cd app

if [ -d ".expo" ]; then
    rm -rf .expo
    echo "   ✓ Cleared .expo cache"
fi

if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "   ✓ Cleared node_modules cache"
fi

rm -rf /tmp/metro-* /tmp/react-* /tmp/haste-* 2>/dev/null
echo "   ✓ Cleared temp files"

if command -v watchman &> /dev/null; then
    watchman watch-del-all 2>/dev/null
    echo "   ✓ Cleared watchman"
fi

cd ..

echo ""

# Verify env file
echo "3. Verifying .env file..."
if [ -f "app/.env" ]; then
    echo "   ✓ app/.env exists"
    
    GEMINI_LINE=$(grep "EXPO_PUBLIC_GEMINI_API_KEY" app/.env)
    if [ -n "$GEMINI_LINE" ]; then
        KEY=$(echo "$GEMINI_LINE" | cut -d'=' -f2)
        echo "   ✓ Gemini key found (${#KEY} chars)"
    else
        echo "   ✗ Gemini key NOT found in .env"
    fi
    
    SUPABASE_LINE=$(grep "EXPO_PUBLIC_SUPABASE_URL" app/.env)
    if [ -n "$SUPABASE_LINE" ]; then
        echo "   ✓ Supabase URL found"
    else
        echo "   ⚠ Supabase URL not found"
    fi
else
    echo "   ✗ app/.env file NOT FOUND!"
    echo "   Create it with:"
    echo "   EXPO_PUBLIC_GEMINI_API_KEY=your_key"
fi

echo ""
echo "✅ Reset complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Start app with cache clear:"
echo "   cd app && npm start -- --clear"
echo ""
echo "2. Wait for Metro to bundle"
echo ""
echo "3. Press 'w' to open web browser"
echo ""
echo "4. Hard refresh browser:"
echo "   • Windows/Linux: Ctrl + Shift + R"
echo "   • Mac: Cmd + Shift + R"
echo ""
echo "5. Check console for:"
echo "   [Gemini] Key check: ..."
echo ""
echo "6. Test recipe import!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
