# Environment Variables

This document lists all environment variables used by the Domain MCP server and testing tools.

## Required Variables

### DYNADOT_API_KEY

**Required**: Yes

### DOMAIN_MCP_AUTH_TOKEN

Bearer token required by Streamable HTTP mode. Generate a high-entropy value
and provide it to clients through their secret or environment configuration.
It is not used by stdio mode.

```bash
export DOMAIN_MCP_AUTH_TOKEN="$(openssl rand -hex 32)"
```

### DOMAIN_MCP_ALLOWED_HOSTS

Optional comma-separated host allowlist for HTTP Host-header validation.
Defaults to the configured bind host plus `localhost`, `127.0.0.1`, and `::1`.
Set this when deploying behind a reverse proxy or public hostname.

```bash
export DOMAIN_MCP_ALLOWED_HOSTS="domains.example.com,127.0.0.1"
```

### DOMAIN_MCP_ALLOWED_ORIGINS

Optional comma-separated browser Origin allowlist. Requests without an Origin
header, including normal MCP clients, remain supported. Set this for browser
clients or reverse-proxy deployments.

```bash
export DOMAIN_MCP_ALLOWED_ORIGINS="https://domains.example.com"
```

### DOMAIN_MCP_SESSION_IDLE_TIMEOUT_MS

Optional idle timeout for stateful HTTP sessions. Defaults to 30 minutes.
Expired sessions are closed and removed, including clients that disconnect
without sending an MCP `DELETE` request.

```bash
export DOMAIN_MCP_SESSION_IDLE_TIMEOUT_MS=1800000
```
**Purpose**: Authentication for Dynadot API
**Format**: 40-character alphanumeric string
**Example**: `your-40-character-api-key-here`

Get your API key from: https://www.dynadot.com/account/domain/setting/api.html?s9F6L9F7U8Q9U8Z8v

## Optional Variables

### DYNADOT_SANDBOX

**Required**: No
**Default**: `false`
**Purpose**: Use Dynadot sandbox environment for testing
**Format**: `true` or `false`
**Example**: `DYNADOT_SANDBOX=true`

**Recommendation**: Set to `true` when testing read-only operations. Some write operations (like `create_contact`) are not supported in sandbox mode.

**⚠️ Sandbox Limitations**: The Dynadot sandbox does not support all API commands. Specifically, `create_contact` fails in sandbox mode. For complete details, see [sandbox.md](./sandbox.md).

### TEST_DOMAIN

**Required**: No (for testing only)
**Default**: None
**Purpose**: Domain to use for test operations
**Format**: Valid domain name you own
**Example**: `TEST_DOMAIN=example.com`

**Note**: Must be a domain registered in your Dynadot account.

### DYNADOT_TARGET_USERNAME

**Required**: Only for push operations
**Default**: None
**Purpose**: Target Dynadot account username for domain push operations
**Format**: Dynadot account username
**Example**: `DYNADOT_TARGET_USERNAME=otheraccount`

**Note**: Required when testing the `domain:push` action. This should be the username of another Dynadot account you control or have permission to push domains to.

### TEST_CONTACT_ID

**Required**: No (for testing only)
**Default**: None
**Purpose**: Contact ID for WHOIS and contact-related tests
**Format**: Numeric string
**Example**: `TEST_CONTACT_ID=1067674`

**How to get**:
- **In Sandbox Mode**: Run `mcp__domain-mcp__contact({ action: "list" })` to see your existing production contact IDs (sandbox cannot create contacts)
- **In Production Mode**: Create a test contact that you can safely modify during testing

**⚠️ Important**: Due to sandbox limitations, you must use an existing contact ID from your production account when testing in sandbox mode. The `create_contact` command does not work in sandbox.

### TEST_FOLDER_ID

**Required**: No (for testing only)
**Default**: `-1` (root folder)
**Purpose**: Folder ID for folder-related tests
**Format**: Numeric string or `-1` for root
**Example**: `TEST_FOLDER_ID=-1`

**How to get**:
- **Option 1 (Recommended)**: Run the setup batch in TEST_INSTRUCTIONS.md to create a test folder automatically
- **Option 2**: Run `mcp__domain-mcp__folder({ action: "list" })` to see your existing folder IDs

**💡 Tip**: The setup batch (Batch 0) creates both a test contact and folder, and the cleanup batch deletes them afterward. This keeps your account clean.

## Configuration Files

### .env File

Create a `.env` file in the project root:

```bash
# Required
DYNADOT_API_KEY=your-api-key-here

# Recommended for testing
DYNADOT_SANDBOX=true

# Testing variables
TEST_DOMAIN=your-domain.com
DYNADOT_TARGET_USERNAME=target-username

# Optional - These can be created dynamically via Batch 0 in TEST_INSTRUCTIONS.md
TEST_CONTACT_ID=1234567
TEST_FOLDER_ID=-1
```

**💡 Simplified Approach**: For most testing, you can use your existing contact IDs. Run `mcp__domain-mcp__contact({ action: "list" })` to find a contact ID from your account, then set it in your `.env` file. No need to create temporary test contacts unless you're testing contact management specifically.

### MCP Server Configuration

The MCP server reads environment variables from:

1. **Process environment** - Set via shell or IDE
2. **.env file** - Loaded automatically by dotenv
3. **MCP config** - Passed directly in `~/.claude/mcp.json`

Example `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "dynadot": {
      "command": "node",
      "args": ["/path/to/domains/dist/index.js"],
      "env": {
        "DYNADOT_API_KEY": "your-api-key",
        "DYNADOT_SANDBOX": "true"
      }
    }
  }
}
```

## Which Variables Are Required?

### For MCP Server Operation
- ✅ `DYNADOT_API_KEY` - **REQUIRED**
- ✅ `DYNADOT_SANDBOX` - **RECOMMENDED** (use `true` for testing)

### For Running Tests
- ✅ `DYNADOT_API_KEY` - **REQUIRED**
- ✅ `DYNADOT_SANDBOX` - **RECOMMENDED** (use `true`)
- ✅ `TEST_DOMAIN` - **REQUIRED** for domain-specific tests
- ⚠️ `TEST_CONTACT_ID` - Required for contact-related tests
- ⚠️ `TEST_FOLDER_ID` - Required for folder-related tests
- ⚠️ `DYNADOT_TARGET_USERNAME` - Required for push operation tests

## Security Best Practices

1. **Never commit `.env` file to git**
   - Already in `.gitignore`
   - Contains sensitive API keys

2. **Use sandbox mode for testing**
   ```bash
   DYNADOT_SANDBOX=true
   ```

3. **Rotate API keys regularly**
   - Generate new keys from Dynadot dashboard
   - Update in all configuration files

4. **Limit API key permissions**
   - Use separate API keys for different environments
   - Revoke unused keys

## Troubleshooting

### "API key required" Error

**Solution**: Set `DYNADOT_API_KEY` environment variable or add to `.env` file.

### "receiver push username parameter not entered"

**Solution**: Set `DYNADOT_TARGET_USERNAME` in `.env` file:
```bash
DYNADOT_TARGET_USERNAME=target-account-username
```

### Tests Using Wrong Domain

**Solution**: Set `TEST_DOMAIN` to a domain you actually own:
```bash
TEST_DOMAIN=mydomain.com
```

### Contact/Folder Tests Failing

**Solution**: Get your actual IDs and update `.env`:
```bash
# Get contact IDs
mcp__domain-mcp__contact({ action: "list" })

# Get folder IDs
mcp__domain-mcp__folder({ action: "list" })

# Update .env
TEST_CONTACT_ID=your-contact-id
TEST_FOLDER_ID=your-folder-id
```

## Environment Variable Reference by Action

### Actions that use TEST_DOMAIN
- All `domain` actions
- All `domain_settings` actions
- All `dns` actions
- `transfer` actions
- `aftermarket` marketplace actions

### Actions that use DYNADOT_TARGET_USERNAME
- `domain:push` - Push domain to another account

### Actions that use TEST_CONTACT_ID
- All `contact` actions (except list)
- `domain_settings:set_whois`
- `folder:set_whois`
- `account:set_default_whois`

### Actions that use TEST_FOLDER_ID
- All `folder` actions (except list and create)
- `domain_settings:set_folder`

## See Also

- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Automated testing documentation
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - MCP server deployment
- [README.md](./README.md) - Main project documentation
