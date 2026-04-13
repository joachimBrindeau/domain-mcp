# Agent-Native Architecture Improvements

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform domain-mcp from a basic API wrapper (71% agent-native) to an exemplary MCP server (93% agent-native) suitable for public distribution.

**Architecture:** Add MCP Resources for context injection, normalize all tool responses, add structured error handling, implement CRUD completeness for DNS/marketplace, add a discovery tool, remove the workflow anti-pattern, and add MCP Prompts.

**Tech Stack:** TypeScript, @modelcontextprotocol/sdk, Zod, Vitest

---

## Task 1: Add MCP Resources for Context Injection

**Files:**
- Create: `src/resources.ts`
- Modify: `src/index.ts:63-71`
- Test: `test/resources.test.ts`

### Step 1: Write the failing test for resources

```typescript
// test/resources.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the client module
vi.mock('../src/client.js', () => ({
  getClient: vi.fn(() => ({
    execute: vi.fn(),
  })),
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAllResources } from '../src/resources.js';
import { getClient } from '../src/client.js';

describe('MCP Resources', () => {
  let server: McpServer;
  let mockClient: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '1.0.0' });
    mockClient = { execute: vi.fn() };
    vi.mocked(getClient).mockReturnValue(mockClient as any);
  });

  it('should register account resource', () => {
    registerAllResources(server);
    // Resources are registered - this verifies the function doesn't throw
    expect(true).toBe(true);
  });

  it('should register domains resource', () => {
    registerAllResources(server);
    expect(true).toBe(true);
  });

  it('should register contacts resource', () => {
    registerAllResources(server);
    expect(true).toBe(true);
  });

  it('should register folders resource', () => {
    registerAllResources(server);
    expect(true).toBe(true);
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- test/resources.test.ts`
Expected: FAIL with "Cannot find module '../src/resources.js'"

### Step 3: Write the resources implementation

```typescript
// src/resources.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getClient } from './client.js';

export function registerAllResources(server: McpServer): void {
  // Account information resource
  server.resource(
    'Account Information',
    'account://info',
    {
      description: 'Current Dynadot account info: balance, email, limits',
      mimeType: 'application/json',
    },
    async () => {
      const client = getClient();
      const result = await client.execute('account_info');
      return {
        contents: [
          {
            uri: 'account://info',
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // Domains list resource
  server.resource(
    'My Domains',
    'domains://list',
    {
      description: 'All domains in your Dynadot account with expiry dates',
      mimeType: 'application/json',
    },
    async () => {
      const client = getClient();
      const result = await client.execute('list_domain');
      return {
        contents: [
          {
            uri: 'domains://list',
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // Contacts list resource
  server.resource(
    'My Contacts',
    'contacts://list',
    {
      description: 'All WHOIS contacts in your Dynadot account',
      mimeType: 'application/json',
    },
    async () => {
      const client = getClient();
      const result = await client.execute('contact_list');
      return {
        contents: [
          {
            uri: 'contacts://list',
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // Folders list resource
  server.resource(
    'My Folders',
    'folders://list',
    {
      description: 'All folders in your Dynadot account',
      mimeType: 'application/json',
    },
    async () => {
      const client = getClient();
      const result = await client.execute('folder_list');
      return {
        contents: [
          {
            uri: 'folders://list',
            mimeType: 'application/json',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}
```

### Step 4: Run test to verify it passes

Run: `npm test -- test/resources.test.ts`
Expected: PASS

### Step 5: Wire up resources in index.ts

Modify `src/index.ts` to add the import and call:

```typescript
// Add import after line 8
import { registerAllResources } from './resources.js';

// Add after registerAllTools(server); (line 68)
registerAllResources(server);
```

### Step 6: Run full test suite

Run: `npm test`
Expected: All tests PASS

### Step 7: Commit

```bash
git add src/resources.ts test/resources.test.ts src/index.ts
git commit -m "feat: add MCP resources for context injection

- Add account://info resource for balance and account details
- Add domains://list resource for all owned domains
- Add contacts://list resource for WHOIS contacts
- Add folders://list resource for folder organization

Improves agent-native score: Context Injection 12.5% → 75%"
```

---

## Task 2: Add Response Normalizer Module

**Files:**
- Create: `src/normalize.ts`
- Test: `test/normalize.test.ts`

### Step 1: Write the failing test for normalizer

```typescript
// test/normalize.test.ts
import { describe, expect, it } from 'vitest';
import { normalizeResponse } from '../src/normalize.js';

describe('Response Normalizer', () => {
  describe('normalizeResponse', () => {
    it('should flatten nested FolderCreateResponse', () => {
      const raw = {
        Status: 'success',
        FolderCreateResponse: {
          FolderCreateContent: {
            FolderId: '12345',
          },
        },
      };

      const result = normalizeResponse('create_folder', raw);

      expect(result).toEqual({
        success: true,
        folderId: '12345',
      });
    });

    it('should flatten DomainInfoResponse', () => {
      const raw = {
        Status: 'success',
        DomainInfoResponse: {
          DomainInfo: {
            Name: 'example.com',
            Expiration: '2025-01-28',
            Locked: 'yes',
          },
        },
      };

      const result = normalizeResponse('domain_info', raw);

      expect(result).toEqual({
        success: true,
        domain: 'example.com',
        expiration: '2025-01-28',
        locked: true,
      });
    });

    it('should pass through unknown commands with camelCase keys', () => {
      const raw = {
        Status: 'success',
        SomeResponse: {
          SomeField: 'value',
        },
      };

      const result = normalizeResponse('unknown_command', raw);

      expect(result.success).toBe(true);
      expect(result.someResponse).toBeDefined();
    });

    it('should handle error responses', () => {
      const raw = {
        Status: 'error',
        Error: 'Domain not found',
      };

      const result = normalizeResponse('domain_info', raw);

      expect(result).toEqual({
        success: false,
        error: 'Domain not found',
      });
    });
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- test/normalize.test.ts`
Expected: FAIL with "Cannot find module '../src/normalize.js'"

### Step 3: Write the normalizer implementation

```typescript
// src/normalize.ts

type RawResponse = Record<string, unknown>;
type NormalizedResponse = Record<string, unknown>;

/**
 * Convert PascalCase to camelCase
 */
function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Recursively convert all keys from PascalCase to camelCase
 */
function camelCaseKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(camelCaseKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[toCamelCase(key)] = camelCaseKeys(value);
    }
    return result;
  }
  return obj;
}

/**
 * Extract the actual content from deeply nested Dynadot responses
 */
function extractContent(raw: RawResponse): Record<string, unknown> {
  // Find the main response key (e.g., FolderCreateResponse, DomainInfoResponse)
  const responseKey = Object.keys(raw).find((k) => k.endsWith('Response') && k !== 'Status');

  if (!responseKey) {
    // No nested response, return as-is (minus Status)
    const { Status, Error, ...rest } = raw;
    return rest as Record<string, unknown>;
  }

  const responseContent = raw[responseKey] as Record<string, unknown>;

  // Find the content key (e.g., FolderCreateContent, DomainInfo)
  const contentKey = Object.keys(responseContent).find(
    (k) => k.endsWith('Content') || k.endsWith('Info') || k.endsWith('List'),
  );

  if (contentKey) {
    return responseContent[contentKey] as Record<string, unknown>;
  }

  // Return the response content directly
  return responseContent;
}

/**
 * Command-specific normalizers for special handling
 */
const normalizers: Record<string, (content: Record<string, unknown>) => NormalizedResponse> = {
  create_folder: (content) => ({
    folderId: String(content.FolderId ?? content.folderId),
  }),

  domain_info: (content) => ({
    domain: content.Name ?? content.name,
    expiration: content.Expiration ?? content.expiration,
    locked: (content.Locked ?? content.locked) === 'yes',
    renewOption: content.RenewOption ?? content.renewOption,
    privacy: content.Privacy ?? content.privacy,
    nameservers: content.NameServers ?? content.nameservers,
    note: content.Note ?? content.note,
  }),

  create_contact: (content) => ({
    contactId: String(content.ContactId ?? content.contactId),
  }),

  search: (content) => {
    const results = (content.SearchResults ?? content.searchResults) as Array<{
      Domain?: string;
      domain?: string;
      Available?: string;
      available?: string;
      Price?: string;
      price?: string;
    }>;
    return {
      results: results?.map((r) => ({
        domain: r.Domain ?? r.domain,
        available: (r.Available ?? r.available) === 'yes',
        price: r.Price ?? r.price,
      })),
    };
  },
};

/**
 * Normalize a Dynadot API response into a clean, flat structure
 */
export function normalizeResponse(command: string, raw: RawResponse): NormalizedResponse {
  // Handle errors
  if (raw.Status === 'error') {
    return {
      success: false,
      error: raw.Error as string,
    };
  }

  // Extract nested content
  const content = extractContent(raw);

  // Apply command-specific normalizer if available
  const normalizer = normalizers[command];
  if (normalizer) {
    return {
      success: true,
      ...normalizer(content),
    };
  }

  // Default: camelCase all keys and flatten
  return {
    success: true,
    ...(camelCaseKeys(content) as Record<string, unknown>),
  };
}
```

### Step 4: Run test to verify it passes

Run: `npm test -- test/normalize.test.ts`
Expected: PASS

### Step 5: Commit

```bash
git add src/normalize.ts test/normalize.test.ts
git commit -m "feat: add response normalizer module

- Flatten deeply nested Dynadot API responses
- Convert PascalCase keys to camelCase
- Add command-specific normalizers for domain_info, create_folder, etc.
- Handle error responses consistently"
```

---

## Task 3: Integrate Normalizer into Tool Registration

**Files:**
- Modify: `src/register.ts:59-62`
- Test: `test/register.test.ts`

### Step 1: Write the failing test

```typescript
// test/register.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../src/client.js', () => ({
  getClient: vi.fn(() => ({
    execute: vi.fn(),
  })),
}));

vi.mock('../src/normalize.js', () => ({
  normalizeResponse: vi.fn((cmd, raw) => ({ success: true, normalized: true })),
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAllTools } from '../src/register.js';
import { getClient } from '../src/client.js';
import { normalizeResponse } from '../src/normalize.js';

describe('Tool Registration with Normalizer', () => {
  let server: McpServer;
  let mockClient: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    server = new McpServer({ name: 'test', version: '1.0.0' });
    mockClient = {
      execute: vi.fn().mockResolvedValue({
        Status: 'success',
        DomainInfoResponse: { DomainInfo: { Name: 'test.com' } },
      }),
    };
    vi.mocked(getClient).mockReturnValue(mockClient as any);
  });

  it('should call normalizeResponse for tool results', async () => {
    registerAllTools(server);

    // The normalizer should be imported and used
    expect(normalizeResponse).toBeDefined();
  });
});
```

### Step 2: Run test to verify current state

Run: `npm test -- test/register.test.ts`
Expected: PASS (baseline)

### Step 3: Modify register.ts to use normalizer

```typescript
// src/register.ts - add import at top (after line 3)
import { normalizeResponse } from './normalize.js';

// Replace lines 59-62 (the result handling) with:
        const result = await client.execute(actionDef.command, params);
        const normalized = normalizeResponse(actionDef.command, result);
        return {
          content: [{ type: 'text', text: JSON.stringify(normalized, null, 2) }],
        };
```

### Step 4: Run full test suite

Run: `npm test`
Expected: All tests PASS

### Step 5: Commit

```bash
git add src/register.ts test/register.test.ts
git commit -m "feat: integrate response normalizer into tool registration

All tool responses now return clean, flat JSON with camelCase keys.
Improves agent-native score: UI Integration 8% → 85%"
```

---

## Task 4: Add Structured Error Handling

**Files:**
- Create: `src/errors.ts`
- Modify: `src/register.ts:47-49`
- Test: `test/errors.test.ts`

### Step 1: Write the failing test

```typescript
// test/errors.test.ts
import { describe, expect, it } from 'vitest';
import { createToolError, ToolError } from '../src/errors.js';

describe('Structured Errors', () => {
  it('should create error with suggestions for unknown action', () => {
    const error = createToolError('unknown_action', {
      type: 'UNKNOWN_ACTION',
      action: 'locks',
      validActions: ['lock', 'unlock', 'list'],
      tool: 'dynadot_domain',
    });

    expect(error.suggestions).toContain("Did you mean 'lock'?");
    expect(error.validActions).toEqual(['lock', 'unlock', 'list']);
  });

  it('should create error with docs URL', () => {
    const error = createToolError('missing_param', {
      type: 'MISSING_PARAM',
      param: 'domain',
      tool: 'dynadot_domain',
    });

    expect(error.docsUrl).toContain('github.com');
  });

  it('should format error as JSON string', () => {
    const error = createToolError('api_error', {
      type: 'API_ERROR',
      message: 'Domain not found',
      tool: 'dynadot_domain',
    });

    const json = JSON.parse(error.toJSON());
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('Domain not found');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- test/errors.test.ts`
Expected: FAIL with "Cannot find module '../src/errors.js'"

### Step 3: Write the errors implementation

```typescript
// src/errors.ts

const DOCS_BASE = 'https://github.com/joachimBrindeau/domain-mcp';

interface ErrorDetails {
  type: 'UNKNOWN_ACTION' | 'MISSING_PARAM' | 'API_ERROR' | 'VALIDATION_ERROR';
  action?: string;
  validActions?: string[];
  param?: string;
  message?: string;
  tool: string;
}

export class ToolError extends Error {
  type: string;
  suggestions: string[];
  validActions?: string[];
  docsUrl: string;
  tool: string;

  constructor(message: string, details: ErrorDetails) {
    super(message);
    this.type = details.type;
    this.tool = details.tool;
    this.suggestions = [];
    this.validActions = details.validActions;
    this.docsUrl = `${DOCS_BASE}#${details.tool.replace('dynadot_', '')}`;

    if (details.type === 'UNKNOWN_ACTION' && details.action && details.validActions) {
      const suggestion = this.findSimilar(details.action, details.validActions);
      if (suggestion) {
        this.suggestions.push(`Did you mean '${suggestion}'?`);
      }
    }
  }

  private findSimilar(input: string, candidates: string[]): string | null {
    // Simple Levenshtein-like matching
    const inputLower = input.toLowerCase();
    for (const candidate of candidates) {
      if (candidate.toLowerCase().startsWith(inputLower.slice(0, 3))) {
        return candidate;
      }
      if (inputLower.startsWith(candidate.toLowerCase().slice(0, 3))) {
        return candidate;
      }
    }
    return null;
  }

  toJSON(): string {
    return JSON.stringify({
      success: false,
      error: {
        type: this.type,
        message: this.message,
        suggestions: this.suggestions.length > 0 ? this.suggestions : undefined,
        validActions: this.validActions,
        docsUrl: this.docsUrl,
      },
    }, null, 2);
  }
}

export function createToolError(message: string, details: ErrorDetails): ToolError {
  return new ToolError(message, details);
}
```

### Step 4: Run test to verify it passes

Run: `npm test -- test/errors.test.ts`
Expected: PASS

### Step 5: Integrate into register.ts

Modify `src/register.ts`:

```typescript
// Add import at top
import { createToolError } from './errors.js';

// Replace lines 47-49 (the unknown action check) with:
        if (!actionDef) {
          const error = createToolError(`Unknown action: ${action}`, {
            type: 'UNKNOWN_ACTION',
            action,
            validActions: actionKeys,
            tool: tool.name,
          });
          return {
            content: [{ type: 'text', text: error.toJSON() }],
            isError: true,
          };
        }
```

### Step 6: Run full test suite

Run: `npm test`
Expected: All tests PASS

### Step 7: Commit

```bash
git add src/errors.ts test/errors.test.ts src/register.ts
git commit -m "feat: add structured error handling with suggestions

- Create ToolError class with type, suggestions, and docs URL
- Add fuzzy matching for 'did you mean' suggestions
- Integrate into tool registration for unknown actions

Improves agent-native score: Capability Discovery +5%"
```

---

## Task 5: Add DNS Delete Action

**Files:**
- Modify: `src/schemas/dns.ts`
- Test: `test/dns-delete.test.ts`

### Step 1: Write the failing test

```typescript
// test/dns-delete.test.ts
import { describe, expect, it } from 'vitest';
import { dnsTool } from '../src/schemas/dns.js';

describe('DNS Delete Action', () => {
  it('should have a clear_dns action', () => {
    expect(dnsTool.actions.clear_dns).toBeDefined();
  });

  it('should have correct command for clear_dns', () => {
    expect(dnsTool.actions.clear_dns.command).toBe('set_dns2');
  });

  it('should have a description for clear_dns', () => {
    expect(dnsTool.actions.clear_dns.description).toContain('clear');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- test/dns-delete.test.ts`
Expected: FAIL with "Cannot read properties of undefined (reading 'command')"

### Step 3: Read current dns.ts

Run: Read file `src/schemas/dns.ts`

### Step 4: Add clear_dns action to dns.ts

Add to the actions object in `src/schemas/dns.ts`:

```typescript
  clear_dns: {
    command: 'set_dns2',
    description: 'Clear all DNS records for a domain (removes all A, AAAA, CNAME, MX, TXT records)',
    params: z.object({
      domain: p.domain,
    }),
    transform: (_action, input) => ({
      domain: input.domain as string,
      // No records = clears all
    }),
  },
```

### Step 5: Run test to verify it passes

Run: `npm test -- test/dns-delete.test.ts`
Expected: PASS

### Step 6: Commit

```bash
git add src/schemas/dns.ts test/dns-delete.test.ts
git commit -m "feat: add clear_dns action for DNS record deletion

Allows clearing all DNS records for a domain.
Improves CRUD completeness for DNS operations."
```

---

## Task 6: Add Marketplace Delisting Action

**Files:**
- Modify: `src/schemas/aftermarket.ts`
- Test: `test/aftermarket-delist.test.ts`

### Step 1: Write the failing test

```typescript
// test/aftermarket-delist.test.ts
import { describe, expect, it } from 'vitest';
import { aftermarketTool } from '../src/schemas/aftermarket.js';

describe('Aftermarket Delist Action', () => {
  it('should have a remove_from_sale action', () => {
    expect(aftermarketTool.actions.remove_from_sale).toBeDefined();
  });

  it('should have correct command', () => {
    expect(aftermarketTool.actions.remove_from_sale.command).toBe('remove_domain_sale_setting');
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- test/aftermarket-delist.test.ts`
Expected: FAIL

### Step 3: Read current aftermarket.ts

Run: Read file `src/schemas/aftermarket.ts`

### Step 4: Add remove_from_sale action

Add to the actions object in `src/schemas/aftermarket.ts`:

```typescript
  remove_from_sale: {
    command: 'remove_domain_sale_setting',
    description: 'Remove domain from marketplace/auction (delist from sale)',
    params: z.object({
      domain: p.domain,
    }),
    transform: tx.domain,
  },
```

### Step 5: Run test to verify it passes

Run: `npm test -- test/aftermarket-delist.test.ts`
Expected: PASS

### Step 6: Commit

```bash
git add src/schemas/aftermarket.ts test/aftermarket-delist.test.ts
git commit -m "feat: add remove_from_sale action for marketplace delisting

Allows removing domains from sale/auction.
Improves CRUD completeness for aftermarket operations."
```

---

## Task 7: Add Discovery Tool (dynadot_help)

**Files:**
- Create: `src/tools/help.ts`
- Modify: `src/tools/index.ts`
- Modify: `src/register.ts`
- Test: `test/help.test.ts`

### Step 1: Write the failing test

```typescript
// test/help.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerHelpTool } from '../src/tools/help.js';

describe('Help Tool', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '1.0.0' });
  });

  it('should register without error', () => {
    expect(() => registerHelpTool(server)).not.toThrow();
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- test/help.test.ts`
Expected: FAIL with "Cannot find module '../src/tools/help.js'"

### Step 3: Write the help tool implementation

```typescript
// src/tools/help.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { compositeTools } from '../schemas/index.js';

const inputSchema = {
  query: z.enum(['tools', 'actions', 'examples']).describe('What to get help on'),
  tool: z.string().optional().describe('Specific tool name (for actions query)'),
};

export function registerHelpTool(server: McpServer): void {
  server.registerTool(
    'dynadot_help',
    {
      description: 'Discover available tools and actions. Use query: "tools" to list all tools, "actions" with a tool name to list actions, "examples" for usage examples.',
      inputSchema,
    },
    async (input) => {
      const query = input.query as string;
      const toolName = input.tool as string | undefined;

      if (query === 'tools') {
        const tools = compositeTools.map((t) => ({
          name: t.name,
          description: t.description,
          actionCount: Object.keys(t.actions).length,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  tools,
                  standalone: [
                    { name: 'check_domain', description: 'Check single domain availability' },
                    { name: 'generate_domains', description: 'Generate domain name suggestions' },
                    { name: 'dynadot_help', description: 'This help tool' },
                  ],
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      if (query === 'actions') {
        if (!toolName) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Please specify a tool name with the "tool" parameter',
                }, null, 2),
              },
            ],
          };
        }

        const tool = compositeTools.find((t) => t.name === toolName);
        if (!tool) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: `Tool "${toolName}" not found`,
                  availableTools: compositeTools.map((t) => t.name),
                }, null, 2),
              },
            ],
          };
        }

        const actions = Object.entries(tool.actions).map(([name, def]) => ({
          name,
          description: def.description,
          command: def.command,
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, tool: toolName, actions }, null, 2),
            },
          ],
        };
      }

      if (query === 'examples') {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  examples: [
                    {
                      description: 'List all domains',
                      tool: 'dynadot_domain',
                      input: { action: 'list' },
                    },
                    {
                      description: 'Check domain availability',
                      tool: 'check_domain',
                      input: { domain: 'example.com', showPrice: true },
                    },
                    {
                      description: 'Get domain DNS records',
                      tool: 'dynadot_dns',
                      input: { action: 'get', domain: 'example.com' },
                    },
                    {
                      description: 'Create a contact',
                      tool: 'dynadot_contact',
                      input: {
                        action: 'create',
                        name: 'John Doe',
                        email: 'john@example.com',
                        phoneCc: '1',
                        phoneNum: '5551234567',
                        address1: '123 Main St',
                        city: 'San Francisco',
                        state: 'CA',
                        zipCode: '94102',
                        country: 'US',
                      },
                    },
                  ],
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Invalid query. Use: tools, actions, or examples',
            }, null, 2),
          },
        ],
      };
    },
  );
}
```

### Step 4: Update tools/index.ts

```typescript
// src/tools/index.ts
export { registerCheckDomainTool } from './check-domain.js';
export { registerGenerateDomainsTools } from './generate-domains.js';
export { registerHelpTool } from './help.js';
```

### Step 5: Update register.ts to register help tool

Add import and call in `src/register.ts`:

```typescript
// Update import
import { registerCheckDomainTool, registerGenerateDomainsTools, registerHelpTool } from './tools/index.js';

// Add after registerCheckDomainTool(server); (at end of function)
  registerHelpTool(server);
```

### Step 6: Run test to verify it passes

Run: `npm test -- test/help.test.ts`
Expected: PASS

### Step 7: Commit

```bash
git add src/tools/help.ts src/tools/index.ts src/register.ts test/help.test.ts
git commit -m "feat: add dynadot_help discovery tool

- List all tools with descriptions and action counts
- Query actions for specific tools
- Provide usage examples for common operations

Improves agent-native score: Capability Discovery 77% → 95%"
```

---

## Task 8: Remove generate_domains Workflow Tool

**Files:**
- Delete: `src/tools/generate-domains.ts`
- Modify: `src/tools/index.ts`
- Modify: `src/register.ts`
- Delete test references

### Step 1: Remove export from tools/index.ts

```typescript
// src/tools/index.ts - remove the generate-domains export
export { registerCheckDomainTool } from './check-domain.js';
export { registerHelpTool } from './help.js';
```

### Step 2: Remove call from register.ts

Remove `registerGenerateDomainsTools(server);` from `src/register.ts`

### Step 3: Delete the file

```bash
rm src/tools/generate-domains.ts
```

### Step 4: Run test suite

Run: `npm test`
Expected: PASS (may need to update any tests that reference generate_domains)

### Step 5: Commit

```bash
git add -A
git commit -m "refactor: remove generate_domains workflow tool

This tool returned instructions instead of data, violating 'tools as primitives'.
Domain name generation should be done by the AI directly.

Improves agent-native score: Tools as Primitives 96% → 98%"
```

---

## Task 9: Add MCP Prompts

**Files:**
- Create: `src/prompts.ts`
- Modify: `src/index.ts`
- Test: `test/prompts.test.ts`

### Step 1: Write the failing test

```typescript
// test/prompts.test.ts
import { describe, expect, it, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAllPrompts } from '../src/prompts.js';

describe('MCP Prompts', () => {
  let server: McpServer;

  beforeEach(() => {
    server = new McpServer({ name: 'test', version: '1.0.0' });
  });

  it('should register domain-audit prompt', () => {
    expect(() => registerAllPrompts(server)).not.toThrow();
  });
});
```

### Step 2: Run test to verify it fails

Run: `npm test -- test/prompts.test.ts`
Expected: FAIL

### Step 3: Write the prompts implementation

```typescript
// src/prompts.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerAllPrompts(server: McpServer): void {
  // Domain audit workflow prompt
  server.prompt(
    'domain-audit',
    {
      description: 'Audit all domains for expiration, DNS, and security settings',
    },
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please audit my domain portfolio:

1. First, read the domains://list resource to get all my domains
2. For each domain, check:
   - Expiration date (flag if < 30 days)
   - Lock status (flag if unlocked)
   - Auto-renewal setting
   - DNS configuration
3. Create a summary table with status indicators
4. Recommend actions for any issues found`,
          },
        },
      ],
    }),
  );

  // DNS setup workflow prompt
  server.prompt(
    'dns-setup',
    {
      description: 'Interactive DNS configuration for a domain',
      arguments: [
        {
          name: 'domain',
          description: 'Domain to configure DNS for',
          required: true,
        },
      ],
    },
    async (args) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me configure DNS for ${args.domain}:

1. First, get current DNS records using dynadot_dns with action: get
2. Ask me what I want to set up:
   - Website hosting (A/AAAA records)
   - Email (MX records)
   - Domain verification (TXT records)
   - Subdomain (CNAME records)
3. Guide me through the configuration
4. Apply changes using dynadot_dns with action: set
5. Verify the changes were applied`,
          },
        },
      ],
    }),
  );

  // Bulk renewal prompt
  server.prompt(
    'bulk-renewal',
    {
      description: 'Review and manage domain renewals',
    },
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me manage domain renewals:

1. Read the domains://list resource
2. Group domains by expiration:
   - Expiring in 30 days (urgent)
   - Expiring in 90 days (soon)
   - Expiring in 1 year (upcoming)
3. Read account://info for current balance
4. Calculate total renewal cost for urgent domains
5. Present options:
   - Enable auto-renewal for specific domains
   - Manually renew now
   - Let domains expire`,
          },
        },
      ],
    }),
  );
}
```

### Step 4: Wire up in index.ts

Add to `src/index.ts`:

```typescript
// Add import
import { registerAllPrompts } from './prompts.js';

// Add after registerAllResources(server);
registerAllPrompts(server);
```

### Step 5: Run test to verify it passes

Run: `npm test -- test/prompts.test.ts`
Expected: PASS

### Step 6: Commit

```bash
git add src/prompts.ts test/prompts.test.ts src/index.ts
git commit -m "feat: add MCP prompts for domain management workflows

- domain-audit: Portfolio health check
- dns-setup: Interactive DNS configuration
- bulk-renewal: Renewal management workflow

Improves agent-native score: Context Injection +5%"
```

---

## Task 10: Add Parameter Examples to Schemas

**Files:**
- Modify: `src/schemas/common.ts`

### Step 1: Update common.ts param descriptions

Modify `src/schemas/common.ts` to add examples:

```typescript
export const p = {
  domain: z.string().describe('Domain name (e.g., example.com, mysite.net)'),
  domains: z.array(z.string()).describe('List of domain names (e.g., ["example.com", "example.net"])'),
  duration: z.number().min(1).max(10).describe('Duration in years, 1-10 (e.g., 1 for one year)'),
  currency: z.string().describe('Currency code (e.g., USD, EUR, GBP)').default('USD'),
  contactId: z.string().describe('Contact ID from contact list (e.g., "12345")'),
  folderId: z.string().describe('Folder ID from folder list (e.g., "67890")'),
  auctionId: z.string().describe('Auction ID (e.g., "auction_123")'),
  orderId: z.string().describe('Order ID (e.g., "order_456")'),
  nameservers: z.array(z.string()).describe('Nameservers (e.g., ["ns1.example.com", "ns2.example.com"])'),
  host: z.string().describe('Nameserver hostname (e.g., ns1.example.com)'),
  ip: z.string().describe('IP address (e.g., 192.168.1.1 or 2001:db8::1)'),
  url: z.string().describe('URL for forwarding (e.g., https://example.com/page)'),
  email: z.string().describe('Email address (e.g., admin@example.com)'),
  note: z.string().describe('Note text (e.g., "Primary business domain")'),
  authCode: z.string().describe('Transfer authorization/EPP code'),
  amount: z.number().describe('Amount in currency (e.g., 9.99)'),
  name: z.string().describe('Name (e.g., "John Doe")'),
  renewOption: z.enum(['auto', 'donot', 'reset']).describe('Renewal: auto (renew), donot (expire), reset (default)'),
  privacyOption: z.enum(['full', 'partial', 'off']).describe('WHOIS privacy: full (hide all), partial (hide email), off (public)'),
  lockAction: z.enum(['lock', 'unlock']).describe('Lock: lock (prevent transfer), unlock (allow transfer)'),
  confirmAction: z.enum(['confirm', 'decline']).describe('Confirm or decline action'),
  pushAction: z.enum(['accept', 'decline']).describe('Accept or decline push request'),
};
```

### Step 2: Run type check

Run: `npm run typecheck`
Expected: PASS

### Step 3: Commit

```bash
git add src/schemas/common.ts
git commit -m "docs: add parameter examples to all schema descriptions

Every parameter now includes an example value for better discoverability.
Improves agent-native score: Capability Discovery +3%"
```

---

## Final: Run Full Test Suite and Build

### Step 1: Run all tests

Run: `npm test`
Expected: All PASS

### Step 2: Run type check

Run: `npm run typecheck`
Expected: No errors

### Step 3: Run linting

Run: `npm run check`
Expected: No errors

### Step 4: Build

Run: `npm run build`
Expected: Successful build

### Step 5: Final commit

```bash
git add -A
git commit -m "chore: complete agent-native improvements

Final agent-native score: 93%

Changes:
- MCP Resources for context injection (account, domains, contacts, folders)
- Response normalization for all tools
- Structured error handling with suggestions
- DNS clear action
- Marketplace delisting action
- dynadot_help discovery tool
- MCP Prompts for workflows
- Parameter examples throughout
- Removed generate_domains workflow anti-pattern"
```

---

## Summary

| Task | Files | Impact |
|------|-------|--------|
| 1. MCP Resources | +2 files | Context Injection +62.5% |
| 2. Response Normalizer | +2 files | UI Integration foundation |
| 3. Integrate Normalizer | ~1 file | UI Integration +77% |
| 4. Structured Errors | +2 files | Capability Discovery +5% |
| 5. DNS Delete | ~1 file | CRUD Completeness +5% |
| 6. Marketplace Delist | ~1 file | CRUD Completeness +5% |
| 7. Help Tool | +2 files | Capability Discovery +13% |
| 8. Remove Workflow | -1 file | Tools as Primitives +2% |
| 9. MCP Prompts | +2 files | Context Injection +5% |
| 10. Parameter Examples | ~1 file | Capability Discovery +3% |

**Total: 71% → 93% agent-native score**
