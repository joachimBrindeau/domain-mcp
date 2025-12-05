# Dynadot API Sandbox Limitations

## Overview

The Dynadot API sandbox (`api-sandbox.dynadot.com`) is a testing environment that doesn't execute real transactions. However, **not all API commands are supported** in the sandbox.

## Contact Management Limitations

### ❌ `create_contact` - NOT SUPPORTED in Sandbox

The `create_contact` command **fails in sandbox mode** with the error:
```json
{
  "CreateContactResponse": {
    "ResponseCode": "-1",
    "Status": "error",
    "Error": "missing phone number"
  }
}
```

**This is NOT a phone number format issue** - the exact same API call succeeds in production mode.

### ✅ Workaround for Testing

When testing in sandbox mode, use **existing contact IDs** from your production account:

1. List your existing contacts in production:
   ```typescript
   mcp__dynadot__dynadot_contact({ action: "list" })
   ```

2. Use an existing contact ID in your tests:
   ```bash
   TEST_CONTACT_ID=your-contact-id  # Use a real contact ID from your account
   ```

### ✅ Commands That WORK in Sandbox

The following contact commands work correctly in sandbox mode:
- `contact_list` - List all contacts
- `get_contact` - Get contact details
- `edit_contact` - Edit existing contact (use production contact IDs)
- `delete_contact` - Delete contact (use production contact IDs)

## Production Mode Testing

If you need to test `create_contact`, you can temporarily switch to production mode:

```bash
# In .env file
DYNADOT_SANDBOX=false  # Use production API
```

**⚠️ Warning**: Production mode operations are real and may incur costs or create actual resources.

## Other Known Sandbox Limitations

The following operations may have limitations in sandbox mode (to be verified):
- Domain registration (`register`)
- Domain transfers (`initiate`)
- Domain renewals (`renew`)
- Payment operations
- Auction bidding

Always check the [official Dynadot API documentation](https://www.dynadot.com/domain/api-commands) for the latest sandbox limitations.

## Testing Strategy

For comprehensive testing:

1. **Use sandbox for read-only operations**:
   - List domains, contacts, folders
   - Get domain info, DNS records, WHOIS data
   - Search domain availability

2. **Use production for write operations** (with caution):
   - Create/edit/delete contacts
   - Update DNS records
   - Modify domain settings

3. **Use existing resource IDs**:
   - Test with real contact IDs from production
   - Test with real folder IDs from production
   - Test with real domains you own

## Root Cause Analysis

The phone number validation error in sandbox mode is likely due to:
1. **Sandbox database limitations** - The sandbox may not have a full contact validation system
2. **Missing backend services** - Contact creation might require services not available in sandbox
3. **Intentional restriction** - Dynadot may intentionally disable contact creation in sandbox to prevent abuse

The fact that the exact same API call with `phonecc=1&phonenum=5551234567` succeeds in production confirms this is a **sandbox-specific limitation**, not a parameter format issue.
