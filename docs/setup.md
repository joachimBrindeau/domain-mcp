# Domain MCP Server Setup Guide - Claude, Cursor, Claude Desktop

Complete guide to integrating the Domain MCP server with your AI assistant for natural language domain management.

## How It Works

```
┌─────────────────┐
│  Claude Code    │
│  Cursor         │  MCP Client asks:
│  Claude Desktop │  "List my domains"
└────────┬────────┘
         │
         │ MCP Protocol
         │
         ▼
┌─────────────────────────┐
│  Domain MCP     │  Converts to:
│  (This Project)         │  dynadot_domain tool
└────────┬────────────────┘  action: list
         │
         │ HTTP REST API
         │
         ▼
┌─────────────────────────┐
│  Dynadot API            │  Returns:
│  api.dynadot.com        │  Your domain list
└─────────────────────────┘
```

**The Flow:**
1. You ask Claude/Cursor: "List my domains"
2. AI uses the `dynadot_domain` MCP tool
3. MCP server calls Dynadot API with your credentials
4. Results return through the chain back to you

## Prerequisites

1. **Get your Dynadot API key:**
   - Log in to your Dynadot account
   - Go to API Settings
   - Generate an API key

2. **Build the MCP server:**
   ```bash
   git clone https://github.com/joachimBrindeau/domain-mcp.git
   cd domain-mcp
   npm install
   npm run build
   ```

## Claude Code Setup

Claude Code uses the MCP configuration file at `~/.claude/mcp.json`.

### 1. Create or Edit MCP Configuration

```bash
# Create the .claude directory if it doesn't exist
mkdir -p ~/.claude

# Edit the MCP configuration
code ~/.claude/mcp.json  # or use your preferred editor
```

### 2. Add Domain MCP

```json
{
  "mcpServers": {
    "dynadot": {
      "command": "node",
      "args": [
        "/absolute/path/to/domain-mcp/dist/index.js"
      ],
      "env": {
        "DYNADOT_API_KEY": "your-api-key-here",
        "DYNADOT_SANDBOX": "true"
      }
    }
  }
}
```

**Important:**
- Replace `/absolute/path/to/domain-mcp` with the actual path
- Replace `your-api-key-here` with your Dynadot API key
- Set `DYNADOT_SANDBOX` to `"false"` for production use

### 3. Restart Claude Code

The MCP server will automatically connect when you restart Claude Code.

### 4. Verify Connection

Ask Claude: "List my Dynadot domains" or "Search for available domains: example.com"

Claude will now have access to 10 Dynadot tools:
- `dynadot_domain` - Domain operations
- `dynadot_dns` - DNS management
- `dynadot_contact` - Contact management
- `dynadot_transfer` - Domain transfers
- `dynadot_nameserver` - Nameserver management
- `dynadot_folder` - Folder organization
- `dynadot_account` - Account settings
- `dynadot_aftermarket` - Auctions and marketplace
- `dynadot_order` - Order management
- `dynadot_domain_settings` - Domain configuration

## Cursor Setup

Cursor uses a similar MCP configuration approach.

### 1. Locate Cursor's MCP Config

Cursor's MCP configuration is typically at:
- **macOS/Linux**: `~/.cursor/mcp.json`
- **Windows**: `%APPDATA%\Cursor\mcp.json`

### 2. Add Domain MCP

```json
{
  "mcpServers": {
    "dynadot": {
      "command": "node",
      "args": [
        "/absolute/path/to/domain-mcp/dist/index.js"
      ],
      "env": {
        "DYNADOT_API_KEY": "your-api-key-here",
        "DYNADOT_SANDBOX": "true"
      }
    }
  }
}
```

### 3. Restart Cursor

Close and reopen Cursor for the changes to take effect.

### 4. Using in Cursor

In Cursor's chat, you can now ask:
- "Check if example.com is available"
- "List all my domains"
- "Set DNS records for mydomain.com"
- "Create a new contact for domain registration"

## Claude Desktop Setup

Claude Desktop uses the same MCP configuration format.

### 1. Locate Claude Desktop Config

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 2. Add Domain MCP

```json
{
  "mcpServers": {
    "dynadot": {
      "command": "node",
      "args": [
        "/absolute/path/to/domain-mcp/dist/index.js"
      ],
      "env": {
        "DYNADOT_API_KEY": "your-api-key-here",
        "DYNADOT_SANDBOX": "true"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

Quit Claude Desktop completely and reopen it.

### 4. Verify MCP Connection

Look for the 🔌 icon in Claude Desktop indicating MCP servers are connected.

## Alternative: Using tsx (Development)

If you want to run the TypeScript source directly without building:

```json
{
  "mcpServers": {
    "dynadot": {
      "command": "npx",
      "args": [
        "tsx",
        "/absolute/path/to/domain-mcp/src/index.ts"
      ],
      "env": {
        "DYNADOT_API_KEY": "your-api-key-here",
        "DYNADOT_SANDBOX": "true"
      }
    }
  }
}
```

This is useful for development but slower than using the built version.

## Environment Variables Explained

### Required
- **DYNADOT_API_KEY**: Your Dynadot API key (required)

### Optional
- **DYNADOT_SANDBOX**: Use sandbox API for testing
  - `"true"` - Use sandbox (safe for testing, no real changes)
  - `"false"` or omit - Use production API (real operations)

## Example Usage Scenarios

### 1. Search for Available Domains

**You ask Claude:**
> "Check if these domains are available: example.com, example.net, example.io"

**Claude uses:** `dynadot_domain` tool with `action: search`

### 2. List Your Domains

**You ask Claude:**
> "Show me all my domains"

**Claude uses:** `dynadot_domain` tool with `action: list`

### 3. Set DNS Records

**You ask Claude:**
> "Set up DNS for mydomain.com with an A record pointing to 192.0.2.1 and www as a CNAME to mydomain.com"

**Claude uses:** `dynadot_dns` tool with `action: set`

### 4. Create a Contact

**You ask Claude:**
> "Create a WHOIS contact for John Doe at john@example.com with address 123 Main St, San Francisco, CA 94102"

**Claude uses:** `dynadot_contact` tool with `action: create`

### 5. Get Domain Information

**You ask Claude:**
> "What's the status of mydomain.com? When does it expire?"

**Claude uses:** `dynadot_domain` tool with `action: info`

### 6. Register a Domain

**You ask Claude:**
> "Register example.com for 2 years"

**Claude uses:** `dynadot_domain` tool with `action: register`

**Note:** This only works in production mode (DYNADOT_SANDBOX=false) and will charge your account!

## Troubleshooting

### MCP Server Not Connecting

1. **Check the path is absolute:**
   ```bash
   # Get absolute path
   cd /path/to/domain-mcp
   pwd  # Copy this output
   ```

2. **Verify the build exists:**
   ```bash
   ls -la dist/index.js
   ```

3. **Check Node.js version:**
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```

4. **Test the server manually:**
   ```bash
   DYNADOT_API_KEY=your-key node dist/index.js
   ```

### API Key Errors

If you see "DYNADOT_API_KEY environment variable is required":

1. Verify your API key is set in the MCP config
2. Ensure there are no extra spaces or quotes
3. Check that the key is valid in your Dynadot account

### Commands Not Working

1. **Restart the MCP client** completely
2. **Check MCP logs** (location varies by client):
   - Claude Code: Check the developer console
   - Cursor: Check logs in settings
   - Claude Desktop: Check Application Support logs

3. **Test in sandbox mode** first before production use

### Sandbox vs Production

**Always start with sandbox mode** (`DYNADOT_SANDBOX=true`):
- Safe for testing
- No real charges or changes
- Some features may have limitations

**Switch to production** (`DYNADOT_SANDBOX=false`) when:
- You've tested thoroughly in sandbox
- You're ready to make real changes
- You understand the costs involved

## Security Best Practices

1. **Never commit your API key** to version control
2. **Use sandbox mode** for development and testing
3. **Rotate your API key** if it's ever exposed
4. **Monitor your API usage** in Dynadot dashboard
5. **Set up alerts** for unexpected domain changes

## Advanced Configuration

### Multiple MCP Servers

You can have multiple MCP servers in the same config:

```json
{
  "mcpServers": {
    "dynadot": {
      "command": "node",
      "args": ["/path/to/domain-mcp/dist/index.js"],
      "env": {
        "DYNADOT_API_KEY": "your-key",
        "DYNADOT_SANDBOX": "true"
      }
    },
    "other-mcp-server": {
      "command": "node",
      "args": ["/path/to/other-server/index.js"]
    }
  }
}
```

### Custom Retry Configuration

You can pass retry configuration via environment variables (requires code modification) or use the default settings:
- Max retries: 3
- Retry delay: 1000ms with exponential backoff
- Timeout: 30000ms (30 seconds)

## Getting Help

- **Documentation**: See [README.md](../README.md) for full API reference
- **Examples**: Check [examples/](../examples/) directory
- **Issues**: Report bugs at https://github.com/joachimBrindeau/domain-mcp/issues
- **API Quirks**: See [CONTRIBUTING.md](../CONTRIBUTING.md) for known limitations

## Next Steps

Once configured:
1. Start with simple queries like "list my domains"
2. Try searching for domains
3. Experiment with DNS management in sandbox mode
4. Read the [examples](../examples/) for more advanced usage
5. Check out [API Quirks](../CONTRIBUTING.md#api-quirks-to-know) before editing contacts or unlocking domains
