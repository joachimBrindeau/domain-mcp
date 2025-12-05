# Domain MCP Quick Reference - Common Commands

Quick reference for AI-powered domain operations using the Dynadot Domain MCP server with Claude, Cursor, or Claude Desktop.

## Common Commands to Ask Your AI

### Domain Operations

| What You Want | Ask Claude/Cursor |
|---------------|-------------------|
| Search for domains | "Check if example.com and example.net are available" |
| List your domains | "Show me all my domains" |
| Domain details | "Get information about example.com" |
| Register domain | "Register example.com for 2 years" |
| Renew domain | "Renew example.com for 1 year" |
| Check pricing | "What's the price for .com domains?" |
| Lock domain | "Lock example.com to prevent transfers" |

### DNS Management

| What You Want | Ask Claude/Cursor |
|---------------|-------------------|
| View DNS | "Show me the DNS records for example.com" |
| Set A record | "Set example.com A record to 192.0.2.1" |
| Add www CNAME | "Add www subdomain as CNAME to example.com" |
| Set MX record | "Set MX record for example.com to mail.example.com with priority 10" |
| Add TXT record | "Add SPF TXT record for example.com" |
| Complex DNS | "Set up example.com with A record 192.0.2.1, www CNAME, and MX records" |

### Contact Management

| What You Want | Ask Claude/Cursor |
|---------------|-------------------|
| List contacts | "Show me all my WHOIS contacts" |
| Create contact | "Create a contact for John Doe at john@example.com" |
| View contact | "Show me details for contact ID 12345" |
| Edit contact | "Update contact 12345 to use email newaddress@example.com" |
| Delete contact | "Delete contact ID 12345" |

### Domain Settings

| What You Want | Ask Claude/Cursor |
|---------------|-------------------|
| Set nameservers | "Set nameservers for example.com to ns1.example.com and ns2.example.com" |
| Enable privacy | "Enable WHOIS privacy for example.com" |
| Domain forwarding | "Forward example.com to https://newsite.com" |
| Set renewal | "Set example.com to auto-renew" |

### Transfers

| What You Want | Ask Claude/Cursor |
|---------------|-------------------|
| Get auth code | "Get the transfer authorization code for example.com" |
| Transfer in | "Initiate transfer for example.com with auth code ABC123" |
| Transfer status | "Check transfer status for example.com" |
| Push domain | "Push example.com to another Dynadot account" |

### Account & Orders

| What You Want | Ask Claude/Cursor |
|---------------|-------------------|
| Account info | "Show me my Dynadot account information" |
| Account balance | "What's my account balance?" |
| Recent orders | "Show my recent domain orders" |
| Available coupons | "What coupons do I have available?" |

## Tool Reference

The MCP server provides 10 tools (106 total actions):

1. **dynadot_domain** - Core domain operations (search, register, renew, delete, info, lock, pricing)
2. **dynadot_dns** - DNS management (get/set records, DNSSEC)
3. **dynadot_contact** - WHOIS contacts (create, edit, delete, list)
4. **dynadot_domain_settings** - Domain config (nameservers, privacy, forwarding)
5. **dynadot_nameserver** - Nameserver management (glue records)
6. **dynadot_transfer** - Domain transfers (in/out, auth codes)
7. **dynadot_folder** - Domain organization (folders, bulk settings)
8. **dynadot_account** - Account settings and defaults
9. **dynadot_aftermarket** - Auctions, backorders, marketplace
10. **dynadot_order** - Order management and history

## Configuration Quick Reference

### Claude Code
```bash
~/.claude/mcp.json
```

### Cursor
```bash
# macOS/Linux
~/.cursor/mcp.json

# Windows
%APPDATA%\Cursor\mcp.json
```

### Claude Desktop
```bash
# macOS
~/Library/Application Support/Claude/claude_desktop_config.json

# Windows
%APPDATA%\Claude\claude_desktop_config.json

# Linux
~/.config/Claude/claude_desktop_config.json
```

## Environment Variables

```bash
DYNADOT_API_KEY=your-key-here    # Required
DYNADOT_SANDBOX=true             # Optional: Use sandbox for testing
```

## Sandbox vs Production

| Mode | Setting | When to Use |
|------|---------|-------------|
| Sandbox | `DYNADOT_SANDBOX=true` | Testing, learning, development |
| Production | `DYNADOT_SANDBOX=false` or omit | Real domain operations |

**⚠️ Always test in sandbox first!**

## Natural Language Examples

The AI understands natural requests. Here are examples:

### Simple Requests
- "List domains"
- "Search example.com"
- "Get pricing for .io"

### Complex Multi-Step Requests
- "Search for tech-startup.com, if available register it for 2 years, then set up DNS with A record to 192.0.2.1 and MX to mail.google.com"
- "Create a contact named Alice Smith with email alice@startup.com at 123 Main St, then use that contact to register startup.io"
- "List all my domains that are expiring in the next 30 days and show me renewal prices"

### Conditional Logic
- "If example.com is available and costs less than $20, register it, otherwise suggest alternatives"
- "Check domains example.com, example.net, example.org - register whichever is cheapest"

### Batch Operations
- "Set auto-renewal on for all my domains"
- "List all domains in my 'portfolio' folder"
- "Create backup contacts for each of my domains"

## Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "API key required" | Missing API key | Add DYNADOT_API_KEY to config |
| "edit_contact requires all fields" | Partial contact update | Provide all contact fields when editing |
| "domain has been locked already" | Lock/unlock failed | May be a Dynadot API limitation |
| Connection timeout | Network/API issue | Check internet, API status |

## Tips & Tricks

### 💡 Use Natural Language
Don't try to guess the exact API syntax. Just ask naturally:
- ✅ "What domains do I own?"
- ❌ "Execute dynadot_domain with action list"

### 💡 Start with Sandbox
Always test new operations in sandbox mode first:
```json
"env": {
  "DYNADOT_SANDBOX": "true"
}
```

### 💡 Ask for Explanations
The AI can explain what it's doing:
- "Explain what you're about to do before registering example.com"
- "What will happen if I enable WHOIS privacy?"

### 💡 Combine Operations
Ask for multi-step workflows:
- "Register example.com and set it up with standard DNS and privacy"
- "Transfer all my expiring domains to a folder called 'renewals'"

### 💡 Use Context
The AI remembers the conversation:
- "List my domains" → "Now sort by expiration date" → "Show me the top 5"

## Additional Resources

- **Full Setup Guide**: [MCP_CLIENT_SETUP.md](MCP_CLIENT_SETUP.md)
- **Usage Examples**: [examples/](examples/)
- **API Documentation**: [README.md](README.md)
- **Known Limitations**: [CONTRIBUTING.md](CONTRIBUTING.md#api-quirks-to-know)
- **Project Status**: [PROJECT_STATUS.md](PROJECT_STATUS.md)
