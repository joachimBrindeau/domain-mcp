/**
 * Custom Client Configuration Example
 *
 * This example demonstrates how to configure the API client with:
 * - Custom retry settings
 * - Custom timeout
 * - Sandbox mode
 * - Direct API key (instead of environment variable)
 */

import { getClient } from '../src/client.js';

async function main() {
  console.log('=== Default Configuration ===');
  // Default client uses environment variables and default settings:
  // - maxRetries: 3
  // - retryDelay: 1000ms (exponential backoff)
  // - timeout: 30000ms
  const defaultClient = getClient();
  console.log('Client created with defaults');

  console.log('\n=== Custom Retry Configuration ===');
  // Create client with custom retry settings
  const customClient = getClient({
    maxRetries: 5, // More retries for flaky networks
    retryDelay: 2000, // Longer base delay (2s with exponential backoff)
    timeout: 60000, // 1 minute timeout for slower operations
  });
  console.log('Client created with custom retry settings');

  console.log('\n=== Sandbox Mode ===');
  // Use sandbox environment for testing
  const sandboxClient = getClient({
    sandbox: true,
    maxRetries: 2, // Fewer retries in sandbox
  });
  console.log('Client created for sandbox environment');

  console.log('\n=== Direct API Key ===');
  // Provide API key directly instead of using environment variable
  const directKeyClient = getClient({
    apiKey: 'your-api-key-here',
    sandbox: true,
  });
  console.log('Client created with direct API key');

  console.log('\n=== Testing Retry Logic ===');
  try {
    // This will demonstrate retry behavior if the API is slow or returns errors
    const result = await customClient.execute('list_domain');
    console.log('Domains listed successfully');
    console.log(
      'Total domains:',
      (result.ListDomainInfoResponse as Record<string, unknown>)?.DomainInfoList ? 'multiple' : '0'
    );
  } catch (error) {
    console.error('Error after retries:', error instanceof Error ? error.message : error);
  }

  console.log('\n=== Configuration Best Practices ===');
  console.log('Production:');
  console.log('  - Use environment variables for API keys');
  console.log('  - Set reasonable retries (3-5)');
  console.log('  - Use longer timeouts for batch operations');
  console.log('');
  console.log('Development:');
  console.log('  - Use sandbox: true');
  console.log('  - Fewer retries to fail fast');
  console.log('  - Lower timeouts to catch issues early');
  console.log('');
  console.log('CI/CD:');
  console.log('  - Use sandbox for automated tests');
  console.log('  - Set strict timeouts to prevent hanging tests');
  console.log('  - Minimal retries to get quick feedback');
}

main().catch(console.error);
