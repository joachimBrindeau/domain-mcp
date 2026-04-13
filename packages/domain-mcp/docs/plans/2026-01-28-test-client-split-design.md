# Test Client Split Design

## Problem

Dynadot sandbox API doesn't support all commands and returns incomplete data for `domain_info` (missing `Note`, `Locked`, `RenewOption` fields). Running all tests against sandbox causes read operations to fail.

## Solution

Split tests to use two client instances:

| Operation Type | Client | Environment | Reason |
|---------------|--------|-------------|--------|
| Read operations | `prodClient` | Production | Full API support, complete data |
| Write operations | `sandboxClient` | Sandbox | Safe to test mutations |

## Implementation

### Client Changes

Exported `DynadotClient` class to allow creating multiple instances:

```typescript
export class DynadotClient { ... }
```

### Test Files

**e2e.test.ts:**
- `describe('read operations')` → `prodClient`
- `describe('write operations (validation only)')` → `sandboxClient`

**functional.test.ts:**
- All CRUD tests (Folder, Contact, Domain settings) → `sandboxClient`

### Skipped Tests

5 verification tests skipped due to sandbox `domain_info` limitations:
- Domain Note verification
- Domain Lock state verification (2 tests)
- Renewal Option verification (2 tests)

These tests write to sandbox successfully but can't verify via `domain_info` because sandbox doesn't return those fields.

## Test Results

- **152 passed**
- **5 skipped** (sandbox limitations)
- **10 test files passed**
