# Domain MCP Server Examples

This directory contains practical examples demonstrating how to use the Dynadot Domain MCP server for AI-powered domain management.

## Prerequisites

1. **Set up environment variables:**
   ```bash
   cp ../.env.example ../.env
   # Edit .env and add your Dynadot API key
   ```

2. **Install dependencies:**
   ```bash
   cd ..
   npm install
   ```

## Running Examples

All examples are TypeScript files that can be run using `tsx`:

```bash
# From the project root
npm run dev examples/basic-domain-operations.ts

# Or use tsx directly
npx tsx examples/basic-domain-operations.ts
```

## Available Examples

### 1. Basic Domain Operations
**File:** `basic-domain-operations.ts`

Demonstrates:
- Searching for domain availability
- Listing your domains
- Getting domain information
- Checking TLD pricing

```bash
npx tsx examples/basic-domain-operations.ts
```

### 2. DNS Management
**File:** `dns-management.ts`

Demonstrates:
- Getting current DNS records
- Setting DNS records (A, AAAA, CNAME, MX, TXT)
- Managing subdomains
- Advanced multi-record configurations

```bash
npx tsx examples/dns-management.ts
```

**Note:** Replace `'yourdomain.com'` with an actual domain you own before running.

### 3. Contact Management
**File:** `contact-management.ts`

Demonstrates:
- Creating WHOIS contacts
- Listing contacts
- Getting contact details
- Editing contacts (shows API quirk: requires ALL fields)
- Deleting contacts

```bash
npx tsx examples/contact-management.ts
```

**Important:** The `edit_contact` API requires ALL fields to be provided, not just the ones being changed.

### 4. Custom Client Configuration
**File:** `custom-client-config.ts`

Demonstrates:
- Configuring retry logic
- Setting custom timeouts
- Using sandbox mode
- Providing API key directly

```bash
npx tsx examples/custom-client-config.ts
```

## Using in Your Own Code

### Import and Use the Client

```typescript
import { getClient } from 'domain-mcp';

// Use default configuration
const client = getClient();
const domains = await client.execute('list_domain');

// Or with custom configuration
const client = getClient({
  maxRetries: 5,
  retryDelay: 2000,
  timeout: 60000,
  sandbox: true,
});
```

### Using via MCP

To use this as an MCP server with Claude Desktop or other MCP clients:

1. **Configure in your MCP client** (e.g., Claude Desktop config):
   ```json
   {
     "mcpServers": {
       "dynadot": {
         "command": "node",
         "args": ["/path/to/domain-mcp/dist/index.js"],
         "env": {
           "DYNADOT_API_KEY": "your-api-key",
           "DYNADOT_SANDBOX": "true"
         }
       }
     }
   }
   ```

2. **Use the tools in your MCP client:**
   - `dynadot_domain` - Domain operations
   - `dynadot_dns` - DNS management
   - `dynadot_contact` - Contact management
   - And 7 more tools covering all Dynadot API operations

## Testing in Sandbox

Always use the sandbox environment for testing to avoid accidental modifications:

```bash
# Set in .env file
DYNADOT_SANDBOX=true

# Or pass in configuration
const client = getClient({ sandbox: true });
```

## Common Patterns

### Error Handling

```typescript
try {
  const result = await client.execute('domain_info', {
    domain: 'example.com',
  });
  console.log(result);
} catch (error) {
  if (error instanceof Error) {
    console.error('API error:', error.message);
  }
}
```

### Batch Operations

```typescript
// Search multiple domains at once
const result = await client.execute('search', {
  domain0: 'example.com',
  domain1: 'example.net',
  domain2: 'example.org',
  domain3: 'example.io',
});
```

### Checking Domain Lock Status

```typescript
const info = await client.execute('domain_info', { domain: 'example.com' });
const isLocked = (info.DomainInfoResponse as any)?.Locked === 'yes';
console.log('Domain locked:', isLocked);
```

## API Quirks to Remember

1. **Contact Editing:** `edit_contact` requires ALL fields, not just changed ones
2. **Parameter Names:** Use `phonecc`/`phonenum` (not `phone_num`), `zip` (not `zip_code`)
3. **Domain Unlocking:** May not work due to domain protection settings (Dynadot API limitation)
4. **Rate Limiting:** Dynadot allows only 1 concurrent request - retry logic handles this automatically

## Need Help?

- Check the main [README](../README.md) for full API documentation
- Review [CONTRIBUTING.md](../CONTRIBUTING.md) for API quirks and best practices
- Open an issue on GitHub if you find bugs or have questions

## License

These examples are part of the Dynadot MCP project and are licensed under the MIT License.
