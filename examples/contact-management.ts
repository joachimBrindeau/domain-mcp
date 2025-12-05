/**
 * Contact Management Example
 *
 * This example demonstrates WHOIS contact operations:
 * - Creating contacts
 * - Listing contacts
 * - Editing contacts (requires ALL fields)
 * - Deleting contacts
 */

import { getClient } from '../src/client.js';

async function main() {
  const client = getClient();

  console.log('=== List Existing Contacts ===');
  const listResult = await client.execute('list_contact');
  console.log('Contacts:', JSON.stringify(listResult, null, 2));

  console.log('\n=== Create New Contact ===');
  const createResult = await client.execute('create_contact', {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phonecc: '1',
    phonenum: '5551234567',
    address1: '123 Main Street',
    address2: 'Suite 100',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    country: 'US',
    organization: 'Example Inc',
  });
  console.log('Created contact:', JSON.stringify(createResult, null, 2));

  // Extract contact ID from response
  const contactId = (createResult.CreateContactResponse as Record<string, unknown>)
    ?.ContactId as string;

  if (contactId) {
    console.log('\n=== Get Contact Details ===');
    const getResult = await client.execute('get_contact', {
      contact_id: contactId,
    });
    console.log('Contact details:', JSON.stringify(getResult, null, 2));

    console.log('\n=== Edit Contact ===');
    // IMPORTANT: edit_contact requires ALL fields, not just the ones being changed
    const editResult = await client.execute('edit_contact', {
      contact_id: contactId,
      name: 'John Doe Jr.', // Changed
      email: 'john.doe@example.com',
      phonecc: '1',
      phonenum: '5551234567',
      address1: '123 Main Street',
      address2: 'Suite 100',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'US',
      organization: 'Example Inc',
    });
    console.log('Contact edited:', JSON.stringify(editResult, null, 2));

    console.log('\n=== Delete Contact ===');
    const deleteResult = await client.execute('delete_contact', {
      contact_id: contactId,
    });
    console.log('Contact deleted:', JSON.stringify(deleteResult, null, 2));
  }

  console.log('\n=== Contact API Quirks ===');
  console.log('IMPORTANT: When using edit_contact, you MUST provide ALL fields:');
  console.log('- Use phonecc and phonenum (not phone_num)');
  console.log('- Use zip (not zip_code)');
  console.log('- Provide all fields even if you only want to change one');
}

main().catch(console.error);
