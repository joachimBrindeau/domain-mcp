# Automated Testing Guide

## Quick Start

Test all 106 Dynadot API actions automatically using Claude Haiku:

```bash
# Read-only mode (safe - recommended)
npm run test:all-tools

# Write mode (destructive - use with caution)
npm run test:all-tools:write
```

## Setup

1. **Set Environment Variables**:

   Create a `.env` file in the project root (see [environment.md](./environment.md) for details):

   ```bash
   # Required
   DYNADOT_API_KEY=your-dynadot-api-key

   # Recommended for testing
   DYNADOT_SANDBOX=true

   # Testing variables
   TEST_DOMAIN=your-domain.com
   DYNADOT_TARGET_USERNAME=target-username
   TEST_CONTACT_ID=1234567
   TEST_FOLDER_ID=-1
   ```

   **For automated testing only** (Claude Haiku API):
   ```bash
   export ANTHROPIC_API_KEY='your-anthropic-api-key'
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build Project**:
   ```bash
   npm run build
   ```

## What Gets Tested

### Read-Only Mode (Default)
Tests 64 safe operations:
- ✅ Domain listing and information
- ✅ DNS record retrieval
- ✅ Contact listing
- ✅ Account information
- ✅ Pricing queries
- ✅ Status checks
- ✅ Auction browsing

Skips 42 write operations:
- ⏭️ Domain registration/deletion
- ⏭️ DNS modifications
- ⏭️ Contact creation/editing
- ⏭️ Setting changes
- ⏭️ Transfer operations
- ⏭️ Purchase operations

### Write Mode
Tests ALL 106 operations including destructive ones.

**⚠️ WARNING**: Only use in sandbox mode!

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│  1. Dynamic Discovery                                    │
│     • Scans src/schema.ts                               │
│     • Finds all 10 tools                                │
│     • Extracts 106 actions                              │
│     • Generates test parameters                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. Batch Testing                                        │
│     • Groups into batches of 5                          │
│     • Sends to Claude Haiku                             │
│     • Parses PASS/FAIL results                          │
│     • Adds 2s delay between batches                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. Reporting                                            │
│     • Console output with statistics                    │
│     • Saves test-results.json                           │
│     • Groups results by tool                            │
│     • Shows duration and errors                         │
└─────────────────────────────────────────────────────────┘
```

## Files Created

```
scripts/
├── test-all-tools.ts      # Main test logic (450+ lines)
│   ├── DynadotToolTester class
│   │   ├── discoverTests()     # Auto-discovery from schema
│   │   ├── generateParams()    # Sample test data
│   │   ├── testBatch()         # Claude Haiku integration
│   │   ├── parseTestResults()  # Result parsing
│   │   └── printReport()       # Comprehensive reporting
│   └── main()
│
├── test-tools.sh          # Bash wrapper with checks
│   ├── Environment validation
│   ├── Safety confirmations
│   └── Error handling
│
└── README.md              # Detailed documentation
```

## Sample Output

```bash
$ npm run test:all-tools

🧪 Domain MCP Tool Tester
========================================

🔍 Discovering test cases from schema...

📊 Discovered 64 test cases (42 skipped)

ℹ️  Running in READ-ONLY mode

🚀 Starting batch testing...

🧪 Testing batch: dynadot_domain:list, info, search, tld_price, push
  ✅ list: PASS
  ✅ info: PASS
  ✅ search: PASS
  ✅ tld_price: PASS
  ✅ push: PASS

⏳ Waiting 2000ms before next batch...

🧪 Testing batch: dynadot_dns:get, get_ns...
  ✅ get: PASS
  ✅ get_ns: PASS

...

========================================
📊 TEST RESULTS SUMMARY
========================================

Total Tests: 106
✅ Passed: 64 (60.4%)
❌ Failed: 0 (0.0%)
⏭️  Skipped: 42 (39.6%)
⏱️  Total Duration: 45.2s

----------------------------------------
📋 RESULTS BY TOOL:
----------------------------------------

dynadot_domain: 11/12 (92%)
dynadot_dns: 5/5 (100%)
dynadot_contact: 6/6 (100%)
dynadot_transfer: 5/5 (100%)
dynadot_nameserver: 5/5 (100%)
dynadot_folder: 14/14 (100%)
dynadot_account: 11/11 (100%)
dynadot_aftermarket: 15/15 (100%)
dynadot_order: 5/5 (100%)
dynadot_domain_settings: 13/13 (100%)

========================================

💾 Results saved to: test-results.json

✨ Testing complete!
```

## Cost Estimation

Using Claude 3.5 Haiku:
- Input: $0.80 / MTok
- Output: $4.00 / MTok

Per full test run (106 tests in ~20 batches):
- Input: ~50K tokens × $0.80 = **$0.04**
- Output: ~25K tokens × $4.00 = **$0.10**
- **Total: ~$0.15** per run

## Configuration

### Batch Size

Edit `scripts/test-all-tools.ts`:

```typescript
// Fast (may hit rate limits)
private batchSize = 10;
private delayMs = 1000;

// Slow but safe
private batchSize = 3;
private delayMs = 5000;
```

### Test Data

Customize sample parameters:

```typescript
const TEST_DATA = {
  domain: 'your-domain.com',
  contactId: '1234567',
  folderId: '-1',
  // ... add more
};
```

### Filter Tools

Test specific tools only:

```typescript
for (const tool of compositeTools) {
  // Only test domain operations
  if (tool.name !== 'dynadot_domain') {
    continue;
  }
  // ...
}
```

## Results File

`test-results.json` contains:

```json
{
  "timestamp": "2024-12-05T10:30:00.000Z",
  "summary": {
    "total": 106,
    "passed": 64,
    "failed": 0,
    "skipped": 42
  },
  "results": [
    {
      "tool": "dynadot_domain",
      "action": "list",
      "status": "pass",
      "duration": 2341
    },
    {
      "tool": "dynadot_domain",
      "action": "info",
      "status": "pass",
      "duration": 2341
    }
  ]
}
```

## Troubleshooting

### Environment Variable Issues

```bash
# Check if variables are set
cat .env

# Create .env file with all required variables
cat > .env << EOF
# Required
DYNADOT_API_KEY=your-api-key

# Recommended
DYNADOT_SANDBOX=true

# Testing variables
TEST_DOMAIN=your-domain.com
DYNADOT_TARGET_USERNAME=target-username
TEST_CONTACT_ID=1234567
TEST_FOLDER_ID=-1
EOF
```

See [environment.md](./environment.md) for detailed documentation on all environment variables.

### Build Errors

```bash
npm install
npm run build
```

### Permission Denied

```bash
chmod +x scripts/test-tools.sh
```

### All Tests Failing

1. Verify MCP server is running
2. Check API keys are valid
3. Ensure sandbox mode is enabled
4. Review `.env` file

## CI/CD Integration

### GitHub Actions

```yaml
name: Test MCP Tools

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm install

      - run: npm run build

      - name: Test All Tools
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          DYNADOT_API_KEY: ${{ secrets.DYNADOT_API_KEY }}
          DYNADOT_SANDBOX: true
        run: npm run test:all-tools

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results.json
```

## Advanced Features

### Parallel Testing

For faster execution (experimental):

```typescript
// Run multiple batches concurrently
await Promise.all([
  this.testBatch(batch1),
  this.testBatch(batch2),
  this.testBatch(batch3),
]);
```

### Custom Validation

Add result validation:

```typescript
private validateResult(result: unknown): boolean {
  // Check for specific response structure
  return typeof result === 'object' &&
         result !== null &&
         'ResponseCode' in result;
}
```

### Detailed Logging

Enable verbose output:

```typescript
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Request:', prompt);
  console.log('Response:', response);
}
```

## Benefits

1. **Regression Testing**: Catch API changes early
2. **Documentation**: Generate live API examples
3. **Validation**: Ensure all 106 actions work
4. **Coverage**: Test every tool automatically
5. **Cost-Effective**: Uses Haiku (~$0.15/run)
6. **Fast**: ~45 seconds for full run
7. **Safe**: Read-only mode by default

## Next Steps

After testing:

1. Review `test-results.json` for failures
2. Fix any failing operations
3. Add to CI/CD pipeline
4. Run before releases
5. Use for API monitoring

---

**Need help?** See `scripts/README.md` for detailed documentation.
