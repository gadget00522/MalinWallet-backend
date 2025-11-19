#!/bin/bash
# Test script for Malin Wallet Backend API
# This script tests all authentication endpoints

BASE_URL="http://localhost:3000"
echo "Testing Malin Wallet Backend API at $BASE_URL"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test health endpoint
echo "1. Testing Health Endpoint"
echo "GET /health"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$body" | json_pp
else
    echo -e "${RED}✗ Health check failed (HTTP $http_code)${NC}"
fi
echo ""

# Generate random email for testing
TEST_EMAIL="test$(date +%s)@example.com"
TEST_PASSWORD="SecurePassword123!"
TEST_WALLET="0xabcdef1234567890"

echo "2. Testing Signup"
echo "POST /auth/signup"
echo "Email: $TEST_EMAIL"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"walletAddress\": \"$TEST_WALLET\"
  }")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
if [ "$http_code" -eq 201 ]; then
    echo -e "${GREEN}✓ Signup successful${NC}"
    echo "$body" | json_pp
else
    echo -e "${RED}✗ Signup failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""
echo "⚠️  Check server logs for verification code"
echo "Press Enter after noting the verification code..."
read -p "Enter the verification code from server logs: " VERIFY_CODE
echo ""

echo "3. Testing Email Verification"
echo "POST /auth/verify-email"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"code\": \"$VERIFY_CODE\"
  }")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Email verification successful${NC}"
    echo "$body" | json_pp
else
    echo -e "${RED}✗ Email verification failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

echo "4. Testing Login"
echo "POST /auth/login"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "$body" | json_pp
    ACCESS_TOKEN=$(echo "$body" | json_pp | grep accessToken | sed 's/.*: "\(.*\)",/\1/')
else
    echo -e "${RED}✗ Login failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

echo "5. Testing Password Reset Request"
echo "POST /auth/request-reset"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/request-reset" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\"
  }")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Reset request successful${NC}"
    echo "$body" | json_pp
else
    echo -e "${RED}✗ Reset request failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""
echo "⚠️  Check server logs for reset code"
read -p "Enter the reset code from server logs: " RESET_CODE
echo ""

NEW_PASSWORD="NewSecurePassword456!"
echo "6. Testing Password Reset Confirmation"
echo "POST /auth/confirm-reset"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/confirm-reset" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"code\": \"$RESET_CODE\",
    \"newPassword\": \"$NEW_PASSWORD\"
  }")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Password reset successful${NC}"
    echo "$body" | json_pp
else
    echo -e "${RED}✗ Password reset failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

echo "7. Testing Login with New Password"
echo "POST /auth/login"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$NEW_PASSWORD\"
  }")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓ Login with new password successful${NC}"
    echo "$body" | json_pp
else
    echo -e "${RED}✗ Login with new password failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

echo "=============================================="
echo "Testing complete!"
