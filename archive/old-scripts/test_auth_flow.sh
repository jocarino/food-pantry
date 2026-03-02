#!/bin/bash

echo "=========================================="
echo "Testing Food Pantry Authentication Flow"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase is running
echo "1. Checking Supabase status..."
if npx supabase status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Supabase is running${NC}"
else
    echo -e "${RED}✗ Supabase is not running${NC}"
    echo "Run: npx supabase start"
    exit 1
fi
echo ""

# Check test user exists
echo "2. Checking test user..."
TEST_USER_COUNT=$(npx supabase db execute "SELECT COUNT(*) FROM auth.users WHERE email = 'test@example.com'" --format csv 2>/dev/null | tail -1)

if [ "$TEST_USER_COUNT" = "1" ]; then
    echo -e "${GREEN}✓ Test user exists (test@example.com)${NC}"
else
    echo -e "${RED}✗ Test user not found${NC}"
    echo "Run: npx supabase db reset"
    exit 1
fi
echo ""

# Check user profile
echo "3. Checking user profile..."
PROFILE_COUNT=$(npx supabase db execute "SELECT COUNT(*) FROM user_profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'test@example.com')" --format csv 2>/dev/null | tail -1)

if [ "$PROFILE_COUNT" = "1" ]; then
    echo -e "${GREEN}✓ User profile exists${NC}"
else
    echo -e "${RED}✗ User profile not found${NC}"
    echo "Run: npx supabase db reset"
    exit 1
fi
echo ""

# Check RLS policies
echo "4. Checking RLS policies..."
RLS_POLICIES=$(npx supabase db execute "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'" --format csv 2>/dev/null | tail -1)

if [ "$RLS_POLICIES" -gt "0" ]; then
    echo -e "${GREEN}✓ RLS policies enabled ($RLS_POLICIES policies)${NC}"
else
    echo -e "${RED}✗ No RLS policies found${NC}"
    exit 1
fi
echo ""

# Check triggers
echo "5. Checking triggers..."
TRIGGERS=$(npx supabase db execute "SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created'" --format csv 2>/dev/null | tail -1)

if [ "$TRIGGERS" = "1" ]; then
    echo -e "${GREEN}✓ User profile trigger exists${NC}"
else
    echo -e "${YELLOW}⚠ User profile trigger not found${NC}"
fi
echo ""

# Display connection info
echo "=========================================="
echo "Connection Information"
echo "=========================================="
echo ""
echo "Studio:      http://127.0.0.1:54323"
echo "REST API:    http://127.0.0.1:54321/rest/v1"
echo "Project URL: http://127.0.0.1:54321"
echo ""
echo "Test Credentials:"
echo "  Email:    test@example.com"
echo "  Password: password123"
echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Open clear_storage.html in your browser"
echo "2. Click 'Clear All Storage'"
echo "3. Refresh your app"
echo "4. Log in with test@example.com / password123"
echo ""
echo -e "${GREEN}All checks passed!${NC}"
