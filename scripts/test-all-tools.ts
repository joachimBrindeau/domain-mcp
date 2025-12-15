#!/usr/bin/env ts-node
/**
 * Dynamic MCP Tool Tester
 *
 * Automatically discovers and tests all 106 Dynadot API actions
 * using Claude Haiku in batches for cost-effective testing.
 */

import { compositeTools } from '../src/schema.js';
import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';

dotenv.config();

interface TestCase {
  tool: string;
  action: string;
  description: string;
  params?: Record<string, unknown>;
}

interface TestResult {
  tool: string;
  action: string;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
  duration?: number;
}

// Actions that require write operations (skip in read-only test mode)
const WRITE_ACTIONS = new Set([
  'register', 'bulk_register', 'delete', 'restore', 'lock',
  'set_ns', 'set_renew_option', 'set_privacy', 'set_whois',
  'set_forwarding', 'set_stealth', 'set_parking', 'set_hosting',
  'set_email_forward', 'set_folder', 'set_note', 'clear_settings',
  'set', 'set_dnssec', 'clear_dnssec',
  'create', 'edit', 'delete',
  'initiate', 'cancel', 'set_auth_code', 'authorize_away', 'set_push_request',
  'register', 'add', 'set_ip', 'delete', 'delete_by_domain',
  'rename', 'set_whois', 'set_ns', 'set_parking', 'set_forwarding',
  'set_stealth', 'set_hosting', 'set_dns', 'set_dns2',
  'set_email_forward', 'set_renew_option', 'clear_settings',
  'set_default_whois', 'set_default_ns', 'set_default_parking',
  'set_default_forwarding', 'set_default_stealth', 'set_default_hosting',
  'set_default_dns', 'set_default_dns2', 'set_default_email_forward',
  'set_default_renew_option', 'clear_defaults',
  'backorder_add', 'backorder_delete', 'auction_bid', 'backorder_auction_bid',
  'expired_buy', 'buy_now', 'set_for_sale', 'afternic_confirm', 'sedo_confirm',
]);

// Sample test data
const TEST_DATA = {
  domain: 'example.com',
  testDomain: 'test-domain-example.com',
  domains: ['example1.com', 'example2.com'],
  tld: 'com',
  currency: 'USD',
  contactId: '0000000',
  folderId: '-1',
  email: 'test@example.com',
  nameservers: ['ns1.example.com', 'ns2.example.com'],
};

class DynadotToolTester {
  private anthropic: Anthropic;
  private testCases: TestCase[] = [];
  private results: TestResult[] = [];
  private batchSize = 5;
  private delayMs = 2000;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Dynamically discover all test cases from schema
   */
  discoverTests(readOnlyMode = true): void {
    console.log('🔍 Discovering test cases from schema...\n');

    for (const tool of compositeTools) {
      for (const [actionName, actionDef] of Object.entries(tool.actions)) {
        const testCase: TestCase = {
          tool: tool.name,
          action: actionName,
          description: actionDef?.description || '',
        };

        // Skip write operations in read-only mode
        if (readOnlyMode && WRITE_ACTIONS.has(actionName)) {
          this.results.push({
            tool: tool.name,
            action: actionName,
            status: 'skip',
            error: 'Write operation (skipped in read-only mode)',
          });
          continue;
        }

        // Add sample params based on action requirements
        testCase.params = this.generateParams(actionName, actionDef?.params?.shape);

        this.testCases.push(testCase);
      }
    }

    const skipped = this.results.filter(r => r.status === 'skip').length;
    console.log(`📊 Discovered ${this.testCases.length} test cases (${skipped} skipped)\n`);
  }

  /**
   * Generate sample parameters for an action
   */
  private generateParams(
    action: string,
    schema?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (!schema || Object.keys(schema).length === 0) {
      return undefined;
    }

    const params: Record<string, unknown> = {};

    // Map common parameter names to test data
    for (const key of Object.keys(schema)) {
      switch (key) {
        case 'domain':
          params.domain = TEST_DATA.domain;
          break;
        case 'domains':
          params.domains = TEST_DATA.domains;
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
        case 'email':
          params.email = TEST_DATA.email;
          break;
        case 'nameservers':
          params.nameservers = TEST_DATA.nameservers;
          break;
        case 'showPrice':
          params.showPrice = false; // Avoid pricing lookups in bulk
          break;
        case 'duration':
          params.duration = 1;
          break;
        default:
          // Leave undefined for optional params
          break;
      }
    }

    return Object.keys(params).length > 0 ? params : undefined;
  }

  /**
   * Test a batch of actions using Claude Haiku
   */
  private async testBatch(batch: TestCase[]): Promise<void> {
    const batchDescription = batch.map(tc => `${tc.tool}:${tc.action}`).join(', ');
    console.log(`\n🧪 Testing batch: ${batchDescription}`);

    const prompt = this.buildTestPrompt(batch);

    try {
      const startTime = Date.now();

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const duration = Date.now() - startTime;
      const response = message.content[0].type === 'text' ? message.content[0].text : '';

      // Parse response and update results
      this.parseTestResults(batch, response, duration);

    } catch (error) {
      console.error(`❌ Batch failed:`, error);
      // Mark all in batch as failed
      for (const tc of batch) {
        this.results.push({
          tool: tc.tool,
          action: tc.action,
          status: 'fail',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Build test prompt for Claude
   */
  private buildTestPrompt(batch: TestCase[]): string {
    const toolCalls = batch.map(tc => {
      const params = tc.params ? JSON.stringify(tc.params, null, 2) : '{}';
      return `
Test ${batch.indexOf(tc) + 1}: ${tc.tool} - ${tc.action}
Description: ${tc.description}
Call: mcp__${tc.tool}(action: "${tc.action}"${tc.params ? `, params: ${params}` : ''})
`;
    }).join('\n');

    return `You are testing MCP tools for the Dynadot domain registrar API.

Test the following ${batch.length} operations and report results:

${toolCalls}

For each test:
1. Call the MCP tool with the specified action and parameters
2. Check if it returns valid JSON (not an error)
3. Report: PASS if successful, FAIL if error

Format your response as:
Test 1: PASS/FAIL [optional: error message]
Test 2: PASS/FAIL [optional: error message]
...

Be concise. Only report the status for each test.`;
  }

  /**
   * Parse test results from Claude's response
   */
  private parseTestResults(batch: TestCase[], response: string, batchDuration: number): void {
    const lines = response.split('\n').filter(l => l.trim().startsWith('Test'));

    for (let i = 0; i < batch.length; i++) {
      const tc = batch[i];
      const line = lines[i];

      if (!line) {
        this.results.push({
          tool: tc.tool,
          action: tc.action,
          status: 'fail',
          error: 'No result in response',
          duration: batchDuration,
        });
        continue;
      }

      const isPassed = line.includes('PASS');
      const isFailed = line.includes('FAIL');
      const errorMatch = line.match(/\[(.*?)\]/);

      this.results.push({
        tool: tc.tool,
        action: tc.action,
        status: isPassed ? 'pass' : isFailed ? 'fail' : 'skip',
        error: errorMatch ? errorMatch[1] : undefined,
        duration: batchDuration,
      });

      const icon = isPassed ? '✅' : isFailed ? '❌' : '⏭️';
      console.log(`  ${icon} ${tc.action}: ${isPassed ? 'PASS' : isFailed ? 'FAIL' : 'SKIP'}`);
    }
  }

  /**
   * Run all tests in batches
   */
  async runAllTests(): Promise<void> {
    console.log(`\n🚀 Starting batch testing (${this.testCases.length} tests, batch size: ${this.batchSize})\n`);

    for (let i = 0; i < this.testCases.length; i += this.batchSize) {
      const batch = this.testCases.slice(i, i + this.batchSize);
      await this.testBatch(batch);

      // Rate limiting delay between batches
      if (i + this.batchSize < this.testCases.length) {
        console.log(`\n⏳ Waiting ${this.delayMs}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, this.delayMs));
      }
    }
  }

  /**
   * Print comprehensive test report
   */
  printReport(): void {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;
    const total = this.results.length;
    const totalDuration = this.results.reduce((sum, r) => sum + (r.duration || 0), 0);

    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
    console.log(`⏭️  Skipped: ${skipped} (${((skipped / total) * 100).toFixed(1)}%)`);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);

    if (failed > 0) {
      console.log('\n' + '-'.repeat(80));
      console.log('❌ FAILED TESTS:');
      console.log('-'.repeat(80));

      const failures = this.results.filter(r => r.status === 'fail');
      for (const result of failures) {
        console.log(`\n${result.tool} → ${result.action}`);
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
      }
    }

    // Group results by tool
    console.log('\n' + '-'.repeat(80));
    console.log('📋 RESULTS BY TOOL:');
    console.log('-'.repeat(80));

    const byTool = new Map<string, TestResult[]>();
    for (const result of this.results) {
      if (!byTool.has(result.tool)) {
        byTool.set(result.tool, []);
      }
      byTool.get(result.tool)!.push(result);
    }

    for (const [tool, results] of byTool) {
      const toolPassed = results.filter(r => r.status === 'pass').length;
      const toolTotal = results.length;
      const percentage = ((toolPassed / toolTotal) * 100).toFixed(0);

      console.log(`\n${tool}: ${toolPassed}/${toolTotal} (${percentage}%)`);
    }

    console.log('\n' + '='.repeat(80));
  }

  /**
   * Save results to JSON file
   */
  async saveResults(filename = 'test-results.json'): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const filepath = path.join(process.cwd(), filename);
    const data = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'pass').length,
        failed: this.results.filter(r => r.status === 'fail').length,
        skipped: this.results.filter(r => r.status === 'skip').length,
      },
      results: this.results,
    };

    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`\n💾 Results saved to: ${filepath}`);
  }
}

// Main execution
async function main() {
  console.log('🧪 Domain MCP Tool Tester');
  console.log('='.repeat(80));

  const tester = new DynadotToolTester();

  // Discover all tests (read-only mode by default)
  const readOnlyMode = !process.argv.includes('--write');
  tester.discoverTests(readOnlyMode);

  if (readOnlyMode) {
    console.log('ℹ️  Running in READ-ONLY mode (use --write flag to test write operations)\n');
  }

  // Run all tests
  await tester.runAllTests();

  // Print report
  tester.printReport();

  // Save results
  await tester.saveResults();

  console.log('\n✨ Testing complete!\n');
}

main().catch(console.error);
