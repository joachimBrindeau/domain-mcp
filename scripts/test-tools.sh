#!/bin/bash
#
# Dynadot MCP Tool Tester - Shell Runner
# Automatically tests all 106 API actions using Claude Haiku
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Dynadot MCP Tool Tester${NC}"
echo "================================================================================"

# Check for required environment variables
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${RED}❌ Error: ANTHROPIC_API_KEY environment variable is not set${NC}"
    echo "Please set your Anthropic API key:"
    echo "  export ANTHROPIC_API_KEY='your-api-key-here'"
    exit 1
fi

if [ -z "$DYNADOT_API_KEY" ]; then
    echo -e "${RED}❌ Error: DYNADOT_API_KEY environment variable is not set${NC}"
    echo "Please set your Dynadot API key in .env file or export it:"
    echo "  export DYNADOT_API_KEY='your-api-key-here'"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo "Creating .env file with current environment variables..."
    cat > .env << EOF
DYNADOT_API_KEY=${DYNADOT_API_KEY}
DYNADOT_SANDBOX=true
TEST_DOMAIN=example.com
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
fi

# Build the project first
echo -e "\n${BLUE}📦 Building project...${NC}"
npm run build

# Run TypeScript file with ts-node
echo -e "\n${BLUE}🚀 Running tests...${NC}\n"

# Check if --write flag is passed
if [ "$1" = "--write" ]; then
    echo -e "${YELLOW}⚠️  Running in WRITE mode - this will test destructive operations!${NC}"
    echo -e "${YELLOW}⚠️  Make sure you're using SANDBOX mode!${NC}"
    echo ""
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    npx ts-node scripts/test-all-tools.ts --write
else
    echo -e "${GREEN}ℹ️  Running in READ-ONLY mode (safe)${NC}"
    echo ""
    npx ts-node scripts/test-all-tools.ts
fi

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Testing completed successfully!${NC}"
else
    echo -e "\n${RED}❌ Testing failed${NC}"
    exit 1
fi
