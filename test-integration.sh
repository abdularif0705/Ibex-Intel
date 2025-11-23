#!/bin/bash

# 🧪 Integration Test Script for Option 2
# Tests Google Custom Search API + Python NLP Service + Supabase Integration

set -e  # Exit on error

echo "🧪 SignalStream Option 2 Integration Tests"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

echo "📋 Prerequisites Check"
echo "---------------------"

# Check if required tools are installed
command -v curl >/dev/null 2>&1
test_result $? "curl is installed"

command -v jq >/dev/null 2>&1
JQ_INSTALLED=$?
if [ $JQ_INSTALLED -ne 0 ]; then
    echo -e "${YELLOW}⚠ Warning${NC}: jq not installed (optional, but recommended for JSON parsing)"
    echo "Install with: sudo apt-get install jq  # or brew install jq on macOS"
fi

echo ""
echo "🔧 Environment Variables Check"
echo "------------------------------"

# Read environment variables (you need to set these)
if [ -z "$GOOGLE_CUSTOM_SEARCH_KEY" ]; then
    echo -e "${YELLOW}⚠ Warning${NC}: GOOGLE_CUSTOM_SEARCH_KEY not set"
    echo "Export it with: export GOOGLE_CUSTOM_SEARCH_KEY=your_key_here"
fi

if [ -z "$GOOGLE_SEARCH_ENGINE_ID" ]; then
    echo -e "${YELLOW}⚠ Warning${NC}: GOOGLE_SEARCH_ENGINE_ID not set"
    echo "Export it with: export GOOGLE_SEARCH_ENGINE_ID=your_engine_id"
fi

if [ -z "$PYTHON_SCRAPER_URL" ]; then
    echo -e "${YELLOW}⚠ Warning${NC}: PYTHON_SCRAPER_URL not set"
    echo "Export it with: export PYTHON_SCRAPER_URL=https://your-app.onrender.com"
fi

echo ""
echo "🧪 Test 1: Google Custom Search API"
echo "------------------------------------"

if [ -n "$GOOGLE_CUSTOM_SEARCH_KEY" ] && [ -n "$GOOGLE_SEARCH_ENGINE_ID" ]; then
    GOOGLE_RESPONSE=$(curl -s "https://www.googleapis.com/customsearch/v1?key=$GOOGLE_CUSTOM_SEARCH_KEY&cx=$GOOGLE_SEARCH_ENGINE_ID&q=SAP+S/4HANA+implementation+site:linkedin.com/jobs" || echo "ERROR")
    
    if echo "$GOOGLE_RESPONSE" | grep -q "items"; then
        test_result 0 "Google Custom Search API returns results"
        
        if [ $JQ_INSTALLED -eq 0 ]; then
            FIRST_URL=$(echo "$GOOGLE_RESPONSE" | jq -r '.items[0].link')
            echo "  Sample URL: $FIRST_URL"
        fi
    elif echo "$GOOGLE_RESPONSE" | grep -q "error"; then
        test_result 1 "Google Custom Search API (check API key/engine ID)"
        if [ $JQ_INSTALLED -eq 0 ]; then
            ERROR_MSG=$(echo "$GOOGLE_RESPONSE" | jq -r '.error.message')
            echo "  Error: $ERROR_MSG"
        fi
    else
        test_result 1 "Google Custom Search API (unknown error)"
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC}: Google API credentials not set"
fi

echo ""
echo "🧪 Test 2: Python NLP Service Health"
echo "-------------------------------------"

if [ -n "$PYTHON_SCRAPER_URL" ]; then
    HEALTH_RESPONSE=$(curl -s "$PYTHON_SCRAPER_URL/health" || echo "ERROR")
    
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        test_result 0 "Python NLP service is healthy"
    else
        test_result 1 "Python NLP service health check"
        echo "  Make sure your service is deployed and running"
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC}: PYTHON_SCRAPER_URL not set"
fi

echo ""
echo "🧪 Test 3: Python NLP Signal Detection"
echo "---------------------------------------"

if [ -n "$PYTHON_SCRAPER_URL" ]; then
    TEST_TEXT="We are hiring an SAP S/4HANA Cutover Manager for a 6-month contract to lead our go-live weekend in Q1 2025. You will manage dress rehearsals, hypercare support, data migration, and UAT testing. This is an urgent hire with immediate start required. Experience with R2R and Workday Financials is a plus."
    
    NLP_RESPONSE=$(curl -s -X POST "$PYTHON_SCRAPER_URL/api/v1/detect-signals" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"$TEST_TEXT\", \"source\": \"test\"}" || echo "ERROR")
    
    if echo "$NLP_RESPONSE" | grep -q "signals_found"; then
        test_result 0 "Python NLP detects signals"
        
        if [ $JQ_INSTALLED -eq 0 ]; then
            SIGNALS_COUNT=$(echo "$NLP_RESPONSE" | jq -r '.signals_found')
            CONFIDENCE=$(echo "$NLP_RESPONSE" | jq -r '.confidence_score_avg')
            STAGE=$(echo "$NLP_RESPONSE" | jq -r '.transformation_stage.stage_name')
            echo "  Signals found: $SIGNALS_COUNT"
            echo "  Avg confidence: $CONFIDENCE%"
            echo "  Stage: $STAGE"
        fi
    else
        test_result 1 "Python NLP signal detection"
        echo "  Response: $NLP_RESPONSE"
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC}: PYTHON_SCRAPER_URL not set"
fi

echo ""
echo "🧪 Test 4: Supabase Secrets Configuration"
echo "------------------------------------------"

if command -v supabase >/dev/null 2>&1; then
    # Check if logged in to Supabase
    if supabase projects list >/dev/null 2>&1; then
        SECRETS_OUTPUT=$(supabase secrets list 2>&1 || echo "ERROR")
        
        if echo "$SECRETS_OUTPUT" | grep -q "GOOGLE_CUSTOM_SEARCH_KEY"; then
            test_result 0 "GOOGLE_CUSTOM_SEARCH_KEY set in Supabase"
        else
            test_result 1 "GOOGLE_CUSTOM_SEARCH_KEY missing in Supabase"
        fi
        
        if echo "$SECRETS_OUTPUT" | grep -q "GOOGLE_SEARCH_ENGINE_ID"; then
            test_result 0 "GOOGLE_SEARCH_ENGINE_ID set in Supabase"
        else
            test_result 1 "GOOGLE_SEARCH_ENGINE_ID missing in Supabase"
        fi
        
        if echo "$SECRETS_OUTPUT" | grep -q "PYTHON_SCRAPER_URL"; then
            test_result 0 "PYTHON_SCRAPER_URL set in Supabase"
        else
            test_result 1 "PYTHON_SCRAPER_URL missing in Supabase"
        fi
    else
        echo -e "${YELLOW}⚠ SKIP${NC}: Not logged in to Supabase CLI"
        echo "  Run: supabase login"
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC}: Supabase CLI not installed"
fi

echo ""
echo "🧪 Test 5: Web Scraping with Python"
echo "------------------------------------"

if [ -n "$PYTHON_SCRAPER_URL" ]; then
    SCRAPE_RESPONSE=$(curl -s -X POST "$PYTHON_SCRAPER_URL/scrape" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://example.com"}' || echo "ERROR")
    
    if echo "$SCRAPE_RESPONSE" | grep -q "success"; then
        test_result 0 "Python scraper can fetch web pages"
    else
        test_result 1 "Python scraper web fetch"
    fi
else
    echo -e "${YELLOW}⚠ SKIP${NC}: PYTHON_SCRAPER_URL not set"
fi

echo ""
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "✨ Your Option 2 integration is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Test manual scan in your app"
    echo "2. Run a smart search with real keywords"
    echo "3. Check signals in dashboard"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "📖 Check the deployment guide:"
    echo "   - DEPLOYMENT_QUICKSTART.md"
    echo "   - GOOGLE_API_SETUP.md"
    echo ""
    echo "🔧 Troubleshooting:"
    if [ -z "$GOOGLE_CUSTOM_SEARCH_KEY" ]; then
        echo "   - Set Google API credentials"
    fi
    if [ -z "$PYTHON_SCRAPER_URL" ]; then
        echo "   - Deploy Python service to Render.com"
    fi
    exit 1
fi

