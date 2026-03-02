#!/bin/bash

# Food Pantry App - Setup Verification Script
# This script checks that all services are running and the app is ready to use

echo "🧪 Food Pantry App - Setup Verification"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Supabase Status
echo "1️⃣  Checking Supabase..."
if supabase status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Supabase is running${NC}"
    SUPABASE_URL=$(supabase status 2>/dev/null | grep "API URL" | awk '{print $4}' | head -1)
    echo "   URL: $SUPABASE_URL"
else
    echo -e "${RED}❌ Supabase is not running${NC}"
    echo "   Run: supabase start"
    exit 1
fi

# Check 2: Expo/Metro Status
echo ""
echo "2️⃣  Checking Expo/Metro Bundler..."
if lsof -i:8081 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Expo is running on port 8081${NC}"
    echo "   Web App: http://localhost:8081"
else
    echo -e "${RED}❌ Expo is not running${NC}"
    echo "   Run: cd app && npm start"
    exit 1
fi

# Check 3: Database Connection
echo ""
echo "3️⃣  Testing database connection..."
if docker exec supabase_db_food-pantry psql -U postgres -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    exit 1
fi

# Check 4: Test User Exists
echo ""
echo "4️⃣  Checking test user..."
USER_COUNT=$(docker exec supabase_db_food-pantry psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM auth.users WHERE email = 'test@example.com'" 2>/dev/null | tr -d ' ')
if [ "$USER_COUNT" -eq "1" ]; then
    echo -e "${GREEN}✅ Test user exists (test@example.com)${NC}"
    USER_ID=$(docker exec supabase_db_food-pantry psql -U postgres -d postgres -t -c "SELECT id FROM auth.users WHERE email = 'test@example.com'" 2>/dev/null | tr -d ' ')
    echo "   User ID: $USER_ID"
else
    echo -e "${YELLOW}⚠️  Test user not found${NC}"
    echo "   Run: cd app && node create-test-user-proper.js"
fi

# Check 5: Pantry Data
echo ""
echo "5️⃣  Checking pantry data..."
ITEM_COUNT=$(docker exec supabase_db_food-pantry psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM pantry_items" 2>/dev/null | tr -d ' ')
if [ "$ITEM_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Pantry has $ITEM_COUNT items${NC}"
else
    echo -e "${YELLOW}⚠️  No pantry items found${NC}"
    echo "   Add test data via SQL scripts"
fi

# Check 6: Environment File
echo ""
echo "6️⃣  Checking environment configuration..."
if [ -f "app/.env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    SUPABASE_URL_ENV=$(grep EXPO_PUBLIC_SUPABASE_URL app/.env | cut -d '=' -f2)
    echo "   Supabase URL: $SUPABASE_URL_ENV"
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo "   Create app/.env file"
    exit 1
fi

# Check 7: Run Connection Test
echo ""
echo "7️⃣  Running connection test..."
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if cd "$SCRIPT_DIR/app" && node test-connection.js > /tmp/test-connection.log 2>&1; then
    echo -e "${GREEN}✅ Connection test passed${NC}"
    echo "   See /tmp/test-connection.log for details"
else
    echo -e "${RED}❌ Connection test failed${NC}"
    echo "   Check /tmp/test-connection.log for errors"
    cat /tmp/test-connection.log
    exit 1
fi

# Check 8: Run Full App Test
echo ""
echo "8️⃣  Running full app flow test..."
if cd "$SCRIPT_DIR/app" && node test-app-flow.js > /tmp/test-app-flow.log 2>&1; then
    echo -e "${GREEN}✅ Full app test passed${NC}"
    echo "   - Sign in working"
    echo "   - Profile fetch working"
    echo "   - Pantry fetch working"
    echo "   - Sign out working"
else
    echo -e "${RED}❌ Full app test failed${NC}"
    echo "   Check /tmp/test-app-flow.log for errors"
    cat /tmp/test-app-flow.log
    exit 1
fi

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
echo ""
echo "🎉 Your Food Pantry App is ready to use!"
echo ""
echo "📝 Next Steps:"
echo "   1. Open http://localhost:8081 in your browser"
echo "   2. Sign in with:"
echo "      Email: test@example.com"
echo "      Password: password123"
echo "   3. See your pantry items!"
echo ""
echo "📱 For mobile testing:"
echo "   1. Install Expo Go on your device"
echo "   2. Scan QR code in terminal where 'npm start' is running"
echo "   3. Sign in with same credentials"
echo ""
echo "📖 Documentation:"
echo "   - READY_TO_TEST.md - Testing guide"
echo "   - STATUS_REPORT.md - Comprehensive status"
echo "   - TEST_CREDENTIALS.md - Test account details"
echo ""
