#!/bin/bash

echo "============================================"
echo "Gemini API Key Tester"
echo "============================================"
echo ""

# Get key from .env
if [ -f app/.env ]; then
    API_KEY=$(grep "EXPO_PUBLIC_GEMINI_API_KEY" app/.env | cut -d'=' -f2)
    
    if [ -z "$API_KEY" ]; then
        echo "❌ No API key found in app/.env"
        exit 1
    fi
    
    echo "✓ Found API key in app/.env"
    echo "Key length: ${#API_KEY} characters"
    echo "Key prefix: ${API_KEY:0:10}..."
    echo ""
else
    echo "❌ app/.env file not found"
    exit 1
fi

echo "Testing API key with Google..."
echo ""

# Test with a simple request
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hello in 3 words"}]}]}')

# Split response and status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS! API key is valid and working!"
    echo ""
    echo "Response preview:"
    echo "$BODY" | grep -o '"text":"[^"]*"' | head -1
    echo ""
    echo "🎉 You can now use recipe import features!"
else
    echo "❌ FAILED! API key is NOT working"
    echo ""
    echo "Error details:"
    echo "$BODY" | grep -o '"message":"[^"]*"' || echo "$BODY"
    echo ""
    echo "Common fixes:"
    echo "1. Get a new key from: https://aistudio.google.com/app/apikey"
    echo "2. Make sure to copy the FULL key"
    echo "3. Update app/.env with the new key"
    echo "4. Restart the app: cd app && npm start"
fi

echo ""
echo "============================================"
