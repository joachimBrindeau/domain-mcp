# Dynadot MCP Tool Tester

Automatically test all 106 Dynadot API actions using Claude Haiku in batches.

## Features

- ✅ **Dynamic Discovery**: Automatically finds all tools and actions from schema
- ✅ **Batch Testing**: Tests in configurable batches (default: 5 at a time)
- ✅ **Claude Haiku**: Uses cost-effective Haiku model for testing
- ✅ **Safety Mode**: Read-only by default, skips destructive operations
- ✅ **Comprehensive Reports**: JSON and console output with statistics
- ✅ **Rate Limiting**: Built-in delays to respect API limits

## Prerequisites

1. **Environment Variables**:
   ```bash
   export ANTHROPIC_API_KEY='your-anthropic-api-key'
   export DYNADOT_API_KEY='your-dynadot-api-key'
   export DYNADOT_SANDBOX=true  # Recommended for testing
   ```

2. **Dependencies**:
   ```bash
   cd /path/to/domains
   npm install
   ```

## Usage

### Read-Only Mode (Safe - Recommended)

Tests only read operations, skips all write/delete operations:

```bash
npm run test:all-tools
```

Or directly:

```bash
./scripts/test-tools.sh
```

### Write Mode (Dangerous - Use with Caution)

Tests ALL operations including destructive ones. **Only use in sandbox mode!**

```bash
npm run test:all-tools:write
```

Or directly:

```bash
./scripts/test-tools.sh --write
```

## How It Works

1. **Discovery Phase**
   - Scans `src/schema.ts` for all composite tools
   - Extracts all actions from each tool
   - Generates sample test parameters
   - Filters out write operations in read-only mode

2. **Batch Testing**
   - Groups tests into batches of 5
   - Sends each batch to Claude Haiku
   - Parses results and records status
   - Adds 2-second delay between batches

3. **Reporting**
   - Console output with progress indicators
   - Summary statistics (pass/fail/skip counts)
   - Results grouped by tool
   - JSON file saved to `test-results.json`

## Sample Output

```
🧪 Dynadot MCP Tool Tester
================================================================================

🔍 Discovering test cases from schema...

📊 Discovered 64 test cases (42 skipped)

ℹ️  Running in READ-ONLY mode (use --write flag to test write operations)

🚀 Starting batch testing (64 tests, batch size: 5)

🧪 Testing batch: dynadot_domain:list, dynadot_domain:info, dynadot_domain:search...
  ✅ list: PASS
  ✅ info: PASS
  ✅ search: PASS
  ✅ tld_price: PASS
  ✅ push: PASS

⏳ Waiting 2000ms before next batch...

...

================================================================================
📊 TEST RESULTS SUMMARY
================================================================================

Total Tests: 106
✅ Passed: 64 (60.4%)
❌ Failed: 0 (0.0%)
⏭️  Skipped: 42 (39.6%)
⏱️  Total Duration: 45.2s

--------------------------------------------------------------------------------
📋 RESULTS BY TOOL:
--------------------------------------------------------------------------------

dynadot_domain: 11/12 (92%)
dynadot_dns: 5/5 (100%)
dynadot_contact: 6/6 (100%)
...

💾 Results saved to: test-results.json

✨ Testing complete!
```

## Configuration

Edit `scripts/test-all-tools.ts` to customize:

```typescript
// Batch size (number of tests per batch)
private batchSize = 5;

// Delay between batches (milliseconds)
private delayMs = 2000;

// Test data for generating sample parameters
const TEST_DATA = {
  domain: 'example.com',
  testDomain: 'test-domain-example.com',
  // ... add more test data
};
```

## Results File

The script generates `test-results.json` with detailed results:

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
    ...
  ]
}
```

## Safety Features

### Read-Only Mode
- **Skips**: register, delete, set_*, create, edit, buy, bid, etc.
- **Tests**: list, info, search, get, pricing, status, etc.

### Write Mode Protection
- Prompts for confirmation before running
- Warns about destructive operations
- Recommends sandbox mode

### Write Operations List
```typescript
const WRITE_ACTIONS = new Set([
  'register', 'bulk_register', 'delete', 'restore', 'lock',
  'set_ns', 'set_renew_option', 'set_privacy', 'set_whois',
  'set_forwarding', 'set_stealth', 'set_parking', 'set_hosting',
  // ... 40+ more write operations
]);
```

## Cost Estimation

Using Claude 3.5 Haiku:
- **Input**: $0.80 / million tokens
- **Output**: $4.00 / million tokens

Estimated cost per full test run:
- ~50 batches × ~1000 input tokens = 50K input tokens ≈ $0.04
- ~50 batches × ~500 output tokens = 25K output tokens ≈ $0.10
- **Total**: ~$0.15 per complete test run (106 tests)

## Troubleshooting

### "ANTHROPIC_API_KEY not found"
```bash
export ANTHROPIC_API_KEY='your-api-key'
# Or add to .env file
```

### "DYNADOT_API_KEY not found"
```bash
export DYNADOT_API_KEY='your-api-key'
# Or add to .env file
```

### All tests failing
- Check that MCP server is built: `npm run build`
- Verify API keys are correct
- Check `.env` file exists and is loaded
- Ensure sandbox mode is enabled

### TypeScript errors
```bash
npm install
npm run build
```

### Permission denied
```bash
chmod +x scripts/test-tools.sh
```

## Architecture

```
scripts/
├── test-all-tools.ts    # Main testing logic
│   ├── DynadotToolTester class
│   │   ├── discoverTests()      # Auto-discover from schema
│   │   ├── generateParams()     # Create sample test data
│   │   ├── testBatch()          # Send batch to Claude
│   │   ├── parseTestResults()   # Extract pass/fail
│   │   └── printReport()        # Generate output
│   └── main()                   # Entry point
│
├── test-tools.sh        # Shell wrapper
│   ├── Environment checks
│   ├── Build project
│   ├── Run TypeScript with ts-node
│   └── Handle --write flag
│
└── README.md            # This file
```

## Advanced Usage

### Custom Test Data

Edit `TEST_DATA` in `test-all-tools.ts`:

```typescript
const TEST_DATA = {
  domain: 'your-test-domain.com',
  contactId: '1234567',
  // ... customize for your account
};
```

### Adjust Batch Size

For faster testing (may hit rate limits):

```typescript
private batchSize = 10;  // Test 10 at a time
private delayMs = 1000;  // 1 second delay
```

For safer, slower testing:

```typescript
private batchSize = 3;   // Test 3 at a time
private delayMs = 5000;  // 5 second delay
```

### Filter Specific Tools

Modify `discoverTests()` to filter:

```typescript
for (const tool of compositeTools) {
  // Only test domain and DNS tools
  if (!['dynadot_domain', 'dynadot_dns'].includes(tool.name)) {
    continue;
  }
  // ... rest of discovery logic
}
```

## CI/CD Integration

Add to GitHub Actions:

```yaml
- name: Test All MCP Tools
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    DYNADOT_API_KEY: ${{ secrets.DYNADOT_API_KEY }}
    DYNADOT_SANDBOX: true
  run: npm run test:all-tools
```

## License

MIT
