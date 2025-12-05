/**
 * Basic Domain Operations Example
 *
 * This example demonstrates common domain management operations:
 * - Searching for domain availability
 * - Checking domain information
 * - Listing your domains
 */

import { getClient } from '../src/client.js';

async function main() {
  // Get the API client (uses DYNADOT_API_KEY from environment)
  const client = getClient();

  console.log('=== Domain Search ===');
  // Search for domain availability
  const searchResult = await client.execute('search', {
    domain0: 'example.com',
    domain1: 'example.net',
    domain2: 'example.org',
  });
  console.log('Search results:', JSON.stringify(searchResult, null, 2));

  console.log('\n=== List Domains ===');
  // List all domains in your account
  const listResult = await client.execute('list_domain');
  console.log('Your domains:', JSON.stringify(listResult, null, 2));

  console.log('\n=== Domain Info ===');
  // Get detailed information about a specific domain
  // Replace 'yourdomain.com' with an actual domain you own
  try {
    const infoResult = await client.execute('domain_info', {
      domain: 'yourdomain.com',
    });
    console.log('Domain info:', JSON.stringify(infoResult, null, 2));
  } catch (error) {
    console.error('Domain info error:', error instanceof Error ? error.message : error);
  }

  console.log('\n=== TLD Pricing ===');
  // Get pricing for a TLD
  const pricingResult = await client.execute('tld_price', {
    tld: 'com',
  });
  console.log('COM pricing:', JSON.stringify(pricingResult, null, 2));
}

main().catch(console.error);
