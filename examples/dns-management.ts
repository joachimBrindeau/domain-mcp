/**
 * DNS Management Example
 *
 * This example demonstrates DNS record management:
 * - Getting current DNS records
 * - Setting new DNS records (A, AAAA, CNAME, MX, TXT)
 * - Managing subdomains
 */

import { getClient } from '../src/client.js';

async function main() {
  const client = getClient();
  const domain = 'yourdomain.com'; // Replace with your domain

  console.log('=== Get Current DNS Records ===');
  try {
    const currentDns = await client.execute('get_dns', { domain });
    console.log('Current DNS:', JSON.stringify(currentDns, null, 2));
  } catch (error) {
    console.error('Get DNS error:', error instanceof Error ? error.message : error);
  }

  console.log('\n=== Set DNS Records ===');
  try {
    // Set DNS records for the domain
    const setDnsResult = await client.execute('set_dns', {
      domain,
      // Main domain records
      main_record_type0: 'A',
      main_record0: '192.0.2.1',
      main_record_type1: 'MX',
      main_record1: 'mail.example.com',
      main_recordx_priority1: 10,
      // Subdomain records
      subdomain0: 'www',
      sub_record_type0: 'CNAME',
      sub_record0: 'example.com',
      subdomain1: 'mail',
      sub_record_type1: 'A',
      sub_record1: '192.0.2.2',
      // TXT record for verification
      main_record_type2: 'TXT',
      main_record2: 'v=spf1 include:_spf.example.com ~all',
    });
    console.log('DNS updated:', JSON.stringify(setDnsResult, null, 2));
  } catch (error) {
    console.error('Set DNS error:', error instanceof Error ? error.message : error);
  }

  console.log('\n=== Advanced DNS Example ===');
  // Example showing multiple record types
  const advancedDnsExample = {
    domain: 'example.com',
    // Root domain A record
    main_record_type0: 'A',
    main_record0: '192.0.2.1',
    // Root domain AAAA record (IPv6)
    main_record_type1: 'AAAA',
    main_record1: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    // MX records for email
    main_record_type2: 'MX',
    main_record2: 'mail1.example.com',
    main_recordx_priority2: 10,
    main_record_type3: 'MX',
    main_record3: 'mail2.example.com',
    main_recordx_priority3: 20,
    // TXT records for SPF and DKIM
    main_record_type4: 'TXT',
    main_record4: 'v=spf1 include:_spf.google.com ~all',
    // Subdomain for www
    subdomain0: 'www',
    sub_record_type0: 'CNAME',
    sub_record0: 'example.com',
    // Subdomain for API
    subdomain1: 'api',
    sub_record_type1: 'A',
    sub_record1: '192.0.2.10',
  };
  console.log('Advanced DNS config example:', JSON.stringify(advancedDnsExample, null, 2));
}

main().catch(console.error);
