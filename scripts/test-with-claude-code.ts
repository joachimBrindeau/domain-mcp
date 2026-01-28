#!/usr/bin/env tsx

/**
 * Claude Code MCP Tool Tester
 *
 * Tests all 106 Domain MCP tools using Claude Code directly.
 * No external API calls - uses your Claude Code subscription.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { compositeTools } from '../src/schemas/index.js';

interface TestCase {
  tool: string;
  action: string;
  description: string;
  params?: Record<string, unknown>;
  skip?: boolean;
  skipReason?: string;
}

interface TestResult {
  tool: string;
  action: string;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
  duration?: number;
  response?: unknown;
}

// Actions that require write operations (skip in read-only mode)
const WRITE_ACTIONS = new Set([
  'register',
  'bulk_register',
  'delete',
  'restore',
  'lock',
  'set_ns',
  'set_renew_option',
  'set_privacy',
  'set_whois',
  'set_forwarding',
  'set_stealth',
  'set_parking',
  'set_hosting',
  'set_email_forward',
  'set_folder',
  'set_note',
  'clear_settings',
  'set',
  'set_dnssec',
  'clear_dnssec',
  'create',
  'edit',
  'delete',
  'initiate',
  'cancel',
  'set_auth_code',
  'authorize_away',
  'set_push_request',
  'register',
  'add',
  'set_ip',
  'delete',
  'delete_by_domain',
  'rename',
  'clear_defaults',
  'backorder_add',
  'backorder_delete',
  'auction_bid',
  'backorder_auction_bid',
  'expired_buy',
  'buy_now',
  'set_for_sale',
  'afternic_confirm',
  'sedo_confirm',
  'update_environment_group_environments',
  'update_environment_group_tags',
  'update_environment_tags',
  'update_environment_team_accesses',
  'update_environment_user_accesses',
  'update_team_members',
]);

// Sample test data (loaded from environment variables)
const TEST_DATA = {
  domain: process.env.TEST_DOMAIN || 'example.com',
  testDomains: ['example1.com', 'example2.com'],
  tld: 'com',
  currency: 'USD',
  contactId: process.env.TEST_CONTACT_ID || '0000000',
  folderId: process.env.TEST_FOLDER_ID || '-1',
  username: process.env.DYNADOT_TARGET_USERNAME || 'targetuser',
};

class ClaudeCodeToolTester {
  private testCases: TestCase[] = [];
  private results: TestResult[] = [];

  /**
   * Discover all test cases from schema
   */
  discoverTests(readOnlyMode = true): void {
    console.log('🔍 Discovering test cases from schema...\n');

    for (const tool of compositeTools) {
      for (const [actionName, actionDef] of Object.entries(tool.actions)) {
        const isWriteAction = WRITE_ACTIONS.has(actionName);

        // Skip write operations in read-only mode
        if (readOnlyMode && isWriteAction) {
          this.testCases.push({
            tool: tool.name,
            action: actionName,
            description: actionDef?.description || '',
            skip: true,
            skipReason: 'Write operation (skipped in read-only mode)',
          });
          continue;
        }

        this.testCases.push({
          tool: tool.name,
          action: actionName,
          description: actionDef?.description || '',
          params: this.generateParams(actionName, actionDef?.params?.shape),
        });
      }
    }

    const toTest = this.testCases.filter((tc) => !tc.skip).length;
    const skipped = this.testCases.filter((tc) => tc.skip).length;
    console.log(`📊 Discovered ${this.testCases.length} total actions`);
    console.log(`   ${toTest} to test, ${skipped} skipped\n`);
  }

  /**
   * Generate sample parameters for an action
   */
  private generateParams(
    action: string,
    schema?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!schema || Object.keys(schema).length === 0) {
      return undefined;
    }

    const params: Record<string, unknown> = {};

    for (const key of Object.keys(schema)) {
      switch (key) {
        case 'domain':
          params.domain = TEST_DATA.domain;
          break;
        case 'domains':
          params.domains = TEST_DATA.testDomains;
          break;
        case 'tld':
          params.tld = TEST_DATA.tld;
          break;
        case 'currency':
          params.currency = TEST_DATA.currency;
          break;
        case 'contactId':
          params.contactId = TEST_DATA.contactId;
          break;
        case 'folderId':
          params.folderId = TEST_DATA.folderId;
          break;
        case 'username':
          params.username = TEST_DATA.username;
          break;
        case 'showPrice':
          params.showPrice = false;
          break;
        case 'duration':
          params.duration = 1;
          break;
      }
    }

    return Object.keys(params).length > 0 ? params : undefined;
  }

  /**
   * Generate test commands for Claude Code to execute
   */
  generateTestBatch(batchSize = 5): string[][] {
    const batches: string[][] = [];
    const toTest = this.testCases.filter((tc) => !tc.skip);

    for (let i = 0; i < toTest.length; i += batchSize) {
      const batch = toTest.slice(i, i + batchSize);
      const commands = batch.map((tc) => {
        const toolName = `mcp__dynadot__${tc.tool}`;
        const params = tc.params
          ? `{ action: "${tc.action}", ...${JSON.stringify(tc.params)} }`
          : `{ action: "${tc.action}" }`;

        return `${toolName}(${params})`;
      });
      batches.push(commands);
    }

    return batches;
  }

  /**
   * Print test script for Claude Code
   */
  printTestScript(): void {
    const batches = this.generateTestBatch(5);

    console.log('📋 TEST SCRIPT FOR CLAUDE CODE');
    console.log('='.repeat(80));
    console.log('\nCopy and paste this into Claude Code to run tests:\n');
    console.log('```typescript');
    console.log('// Test all Domain MCP tools');
    console.log('// Copy each batch and run separately\n');

    batches.forEach((batch, idx) => {
      console.log(`\n// Batch ${idx + 1} (${batch.length} tests)`);
      console.log('const results = await Promise.allSettled([');
      batch.forEach((cmd, i) => {
        const comma = i < batch.length - 1 ? ',' : '';
        console.log(`  ${cmd}${comma}`);
      });
      console.log(']);');
      console.log('console.log(results);');
      console.log(`// Check results before running next batch`);
    });

    console.log('```\n');
  }

  /**
   * Generate markdown test instructions
   */
  async generateMarkdownInstructions(filename = 'TEST_INSTRUCTIONS.md'): Promise<void> {
    const batches = this.generateTestBatch(5);
    const toTest = this.testCases.filter((tc) => !tc.skip);
    const skipped = this.testCases.filter((tc) => tc.skip);

    let md = `# Claude Code MCP Tool Testing Instructions

## Overview

Testing ${toTest.length} actions across ${compositeTools.length} tools.
${skipped.length} write operations skipped in read-only mode.

## Test Statistics

| Metric | Value |
|--------|-------|
| Total Actions | ${this.testCases.length} |
| To Test | ${toTest.length} |
| Skipped | ${skipped.length} |
| Batches | ${batches.length + 2} (including setup/cleanup) |

## How to Test

1. Open Claude Code
2. **Run Batch 0 (Setup)** first to create test resources
3. **Copy the contact and folder IDs** from the output
4. Run Batches 1-${batches.length}
5. **Run Cleanup Batch** to delete test resources

## Batch 0: Setup (Run First)

Create test contact and folder for testing:

\`\`\`typescript
// Setup: Create test resources
const setupResults = await Promise.allSettled([
  mcp__dynadot__dynadot_contact({
    action: "create",
    name: "MCP Test Contact",
    email: "mcp-test@example.com",
    phoneCc: "1",
    phoneNum: "5559876543",
    address1: "123 Test Street",
    city: "Test City",
    state: "CA",
    zipCode: "94102",
    country: "US"
  }),
  mcp__dynadot__dynadot_folder({
    action: "create",
    folderName: "MCP Test Folder"
  })
]);

console.log("📝 Setup Results:");
setupResults.forEach((r, i) => {
  if (r.status === "fulfilled") {
    console.log(\`✅ \${i === 0 ? 'Contact' : 'Folder'} created:\`, r.value);
  } else {
    console.log(\`❌ \${i === 0 ? 'Contact' : 'Folder'} failed:\`, r.reason);
  }
});

// Extract IDs from responses
const contactId = setupResults[0].status === "fulfilled" ?
  setupResults[0].value?.CreateContactResponse?.ContactId : null;
const folderId = setupResults[1].status === "fulfilled" ?
  setupResults[1].value?.CreateFolderResponse?.FolderId ||
  setupResults[1].value?.FolderCreateResponse?.FolderId : null;

console.log("\\n📋 Save these IDs for testing:");
console.log(\`TEST_CONTACT_ID=\${contactId}\`);
console.log(\`TEST_FOLDER_ID=\${folderId}\`);
\`\`\`

**Important**: Copy the contact and folder IDs and update your \`.env\` file before running the remaining batches.

## Test Batches

`;

    batches.forEach((batch, idx) => {
      const startIdx = idx * 5;
      const testCases = toTest.slice(startIdx, startIdx + 5);

      md += `### Batch ${idx + 1} of ${batches.length}\n\n`;
      md += `**Testing**: ${testCases.map((tc) => `${tc.tool}:${tc.action}`).join(', ')}\n\n`;
      md += '```typescript\n';
      md += `// Batch ${idx + 1}\n`;
      md += 'const results = await Promise.allSettled([\n';
      batch.forEach((cmd, i) => {
        const comma = i < batch.length - 1 ? ',' : '';
        md += `  ${cmd}${comma}\n`;
      });
      md += ']);\n';
      md += 'results.forEach((r, i) => {\n';
      md += '  if (r.status === "fulfilled") {\n';
      md += '    console.log(`✅ Test ${i + 1}: PASS`);\n';
      md += '  } else {\n';
      md += '    console.log(`❌ Test ${i + 1}: FAIL - ${r.reason}`);\n';
      md += '  }\n';
      md += '});\n';
      md += '```\n\n';

      md += '**Expected Actions**:\n';
      testCases.forEach((tc, i) => {
        md += `${i + 1}. \`${tc.action}\` - ${tc.description}\n`;
      });
      md += '\n---\n\n';
    });

    md += `## Cleanup Batch (Run Last)

Delete test resources after testing:

\`\`\`typescript
// Cleanup: Delete test resources
// Replace with the IDs from Batch 0 setup
const TEST_CONTACT_ID = "your-contact-id";
const TEST_FOLDER_ID = "your-folder-id";

const cleanupResults = await Promise.allSettled([
  mcp__dynadot__dynadot_contact({
    action: "delete",
    contactId: TEST_CONTACT_ID
  }),
  mcp__dynadot__dynadot_folder({
    action: "delete",
    folderId: TEST_FOLDER_ID
  })
]);

console.log("🧹 Cleanup Results:");
cleanupResults.forEach((r, i) => {
  if (r.status === "fulfilled") {
    console.log(\`✅ \${i === 0 ? 'Contact' : 'Folder'} deleted:\`, r.value);
  } else {
    console.log(\`❌ \${i === 0 ? 'Contact' : 'Folder'} deletion failed:\`, r.reason);
  }
});
\`\`\`

---

## Skipped Actions (${skipped.length})

Write operations skipped in read-only mode:

`;

    const skippedByTool = new Map<string, TestCase[]>();
    skipped.forEach((tc) => {
      if (!skippedByTool.has(tc.tool)) {
        skippedByTool.set(tc.tool, []);
      }
      skippedByTool.get(tc.tool)!.push(tc);
    });

    for (const [tool, cases] of skippedByTool) {
      md += `### ${tool}\n`;
      cases.forEach((tc) => {
        md += `- \`${tc.action}\` - ${tc.description}\n`;
      });
      md += '\n';
    }

    md += `## Recording Results

After each batch, record results:

\`\`\`typescript
// Copy this template for each batch
const batch${1}_results = {
  batch: ${1},
  timestamp: new Date().toISOString(),
  results: [
    { action: "action1", status: "pass|fail", error: "..." },
    { action: "action2", status: "pass|fail", error: "..." },
    // ...
  ]
};
\`\`\`

## Final Report

After all batches, generate summary:

\`\`\`typescript
const allResults = [batch1_results, batch2_results, /* ... */];
const summary = {
  total: ${toTest.length},
  passed: allResults.flatMap(b => b.results).filter(r => r.status === "pass").length,
  failed: allResults.flatMap(b => b.results).filter(r => r.status === "fail").length,
};
console.log(\`✅ Passed: \${summary.passed}/\${summary.total}\`);
console.log(\`❌ Failed: \${summary.failed}/\${summary.total}\`);
\`\`\`
`;

    const filepath = path.join(process.cwd(), filename);
    await fs.writeFile(filepath, md);
    console.log(`\n💾 Test instructions saved to: ${filepath}`);
  }

  /**
   * Generate a simple shell script that can be executed
   */
  async generateShellScript(filename = 'test-mcp-tools.sh'): Promise<void> {
    const toTest = this.testCases.filter((tc) => !tc.skip);

    let script = `#!/bin/bash
#
# MCP Tool Test Script
# Run all ${toTest.length} Domain MCP tests
#

set -e

echo "🧪 Testing ${toTest.length} Domain MCP Tools"
echo "==============================================="
echo ""

PASS=0
FAIL=0
TOTAL=0

`;

    toTest.forEach((tc, idx) => {
      const toolName = `mcp__dynadot__${tc.tool}`;
      const params = tc.params
        ? `'action=${tc.action}, params=${JSON.stringify(tc.params)}'`
        : `'action=${tc.action}'`;

      script += `
# Test ${idx + 1}: ${tc.tool} - ${tc.action}
echo "Testing ${idx + 1}/${toTest.length}: ${tc.action}..."
TOTAL=$((TOTAL + 1))

# Note: This is a placeholder - actual MCP calls would be done through Claude Code
# echo "Would call: ${toolName}(${params})"
`;
    });

    script += `
echo ""
echo "==============================================="
echo "📊 Results: $PASS passed, $FAIL failed out of $TOTAL"
echo "==============================================="
`;

    const filepath = path.join(process.cwd(), 'scripts', filename);
    await fs.writeFile(filepath, script, { mode: 0o755 });
    console.log(`💾 Shell script saved to: ${filepath}`);
  }
}

// Main execution
async function main() {
  console.log('🧪 Claude Code MCP Tool Test Generator');
  console.log('='.repeat(80));
  console.log('');

  const tester = new ClaudeCodeToolTester();

  // Discover tests
  const readOnlyMode = !process.argv.includes('--write');
  tester.discoverTests(readOnlyMode);

  if (readOnlyMode) {
    console.log('ℹ️  Running in READ-ONLY mode\n');
  }

  // Generate test instructions
  await tester.generateMarkdownInstructions();

  console.log('\n✨ Test generator complete!');
  console.log('\n📖 Next steps:');
  console.log('   1. Open TEST_INSTRUCTIONS.md');
  console.log('   2. Copy each batch into Claude Code');
  console.log('   3. Run and record results');
  console.log('   4. Generate final summary\n');
}

main().catch(console.error);
