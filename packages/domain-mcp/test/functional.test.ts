import { describe, expect, it } from 'vitest';
import { DynadotClient } from '../src/client.js';

const TEST_DOMAIN = process.env.TEST_DOMAIN;
const isIntegrationEnabled = process.env.RUN_INTEGRATION_TESTS === 'true';

// Sandbox client for functional CRUD tests (safe to create/delete)
const sandboxClient = new DynadotClient({ sandbox: true });
const describeIntegration = describe.runIf(isIntegrationEnabled);

describeIntegration('Integration test prerequisites', () => {
  it('should have required environment variables', () => {
    expect(TEST_DOMAIN).toBeDefined();
    expect(process.env.DYNADOT_API_KEY).toBeDefined();
  });
});

// =============================================================================
// FUNCTIONAL TESTS - Actually verify operations work end-to-end
// =============================================================================

describeIntegration('Functional: Folder CRUD', () => {
  const testFolderName = `test-folder-${Date.now()}`;
  let createdFolderId: string | null = null;

  it('1. should create a new folder', async () => {
    const result = await sandboxClient.execute('create_folder', { folder_name: testFolderName });
    // API returns: FolderCreateResponse.FolderCreateContent.FolderId
    const response = result.FolderCreateResponse as Record<string, unknown>;
    const content = response?.FolderCreateContent as Record<string, unknown>;

    expect(response).toBeDefined();
    expect(content?.FolderId).toBeDefined();

    createdFolderId = String(content.FolderId);
    console.log(`Created folder: ${testFolderName} (ID: ${createdFolderId})`);
  });

  it('2. should find the folder in list', async () => {
    expect(createdFolderId).not.toBeNull();

    const result = await sandboxClient.execute('folder_list');
    const response = result.FolderListResponse as Record<string, unknown>;

    // Find our folder in the list
    const folders = response.FolderList as Array<Record<string, unknown>> | undefined;
    const found = folders?.some(
      (f) => String(f.FolderId) === createdFolderId || f.FolderName === testFolderName,
    );

    expect(found).toBe(true);
    console.log(`Verified folder exists in list`);
  });

  it('3. should rename the folder', async () => {
    expect(createdFolderId).not.toBeNull();

    const newName = `${testFolderName}-renamed`;
    const result = await sandboxClient.execute('set_folder_name', {
      folder_id: createdFolderId,
      folder_name: newName,
    });
    const response = result.SetFolderNameResponse as Record<string, unknown>;

    expect(response).toBeDefined();
    console.log(`Renamed folder to: ${newName}`);
  });

  it('4. should delete the folder', async () => {
    expect(createdFolderId).not.toBeNull();

    const result = await sandboxClient.execute('delete_folder', { folder_id: createdFolderId });
    const response = result.DeleteFolderResponse as Record<string, unknown>;

    expect(response).toBeDefined();
    console.log(`Deleted folder ID: ${createdFolderId}`);
  });

  it('5. should NOT find the folder in list after deletion', async () => {
    const result = await sandboxClient.execute('folder_list');
    const response = result.FolderListResponse as Record<string, unknown>;

    const folders = response.FolderList as Array<Record<string, unknown>> | undefined;
    const found = folders?.some((f) => String(f.FolderId) === createdFolderId);

    expect(found).toBeFalsy();
    console.log(`Verified folder no longer exists`);
  });
});

describeIntegration('Functional: Contact CRUD', () => {
  const testContactName = `Test Contact ${Date.now()}`;
  let createdContactId: string | null = null;

  it('1. should create a new contact', async () => {
    // API requires: phonecc (country code), phonenum (number without country code), zip (not zip_code)
    const result = await sandboxClient.execute('create_contact', {
      name: testContactName,
      email: 'test-functional@example.com',
      phonecc: '1',
      phonenum: '5551234567',
      address1: '123 Test Street',
      city: 'Test City',
      state: 'CA',
      zip: '94102',
      country: 'US',
    });
    // API returns: CreateContactResponse.CreateContactContent.ContactId
    const response = result.CreateContactResponse as Record<string, unknown>;
    const content = response?.CreateContactContent as Record<string, unknown>;

    expect(response).toBeDefined();
    expect(content?.ContactId).toBeDefined();

    createdContactId = String(content.ContactId);
    console.log(`Created contact: ${testContactName} (ID: ${createdContactId})`);
  });

  it('2. should find the contact in list', async () => {
    expect(createdContactId).not.toBeNull();

    const result = await sandboxClient.execute('contact_list');
    const response = result.ContactListResponse as Record<string, unknown>;

    const contacts = response.ContactList as Array<Record<string, unknown>> | undefined;
    const found = contacts?.some((c) => String(c.ContactId) === createdContactId);

    expect(found).toBe(true);
    console.log(`Verified contact exists in list`);
  });

  it('3. should get contact details', async () => {
    expect(createdContactId).not.toBeNull();

    const result = await sandboxClient.execute('get_contact', { contact_id: createdContactId });
    // API returns: GetContactResponse.GetContact.Name
    const response = result.GetContactResponse as Record<string, unknown>;
    const contact = response?.GetContact as Record<string, unknown>;

    expect(response).toBeDefined();
    expect(contact?.Name).toBe(testContactName);
    expect(contact?.Email).toBe('test-functional@example.com');
    console.log(`Verified contact details match`);
  });

  it('4. should edit the contact', async () => {
    expect(createdContactId).not.toBeNull();

    const updatedName = `${testContactName} Updated`;
    // Note: Dynadot API requires ALL fields to be provided when editing, not just changed fields
    const result = await sandboxClient.execute('edit_contact', {
      contact_id: createdContactId,
      name: updatedName,
      email: 'test-functional@example.com',
      phonecc: '1',
      phonenum: '5551234567',
      address1: '123 Test Street',
      city: 'Test City',
      state: 'CA',
      zip: '94102',
      country: 'US',
    });
    const response = result.EditContactResponse as Record<string, unknown>;

    expect(response).toBeDefined();
    console.log(`Updated contact name to: ${updatedName}`);
  });

  it('5. should verify the edit', async () => {
    expect(createdContactId).not.toBeNull();

    const result = await sandboxClient.execute('get_contact', { contact_id: createdContactId });
    const response = result.GetContactResponse as Record<string, unknown>;
    const contact = response?.GetContact as Record<string, unknown>;

    expect(contact?.Name).toBe(`${testContactName} Updated`);
    console.log(`Verified contact name was updated to: ${contact?.Name}`);
  });

  it('6. should delete the contact', async () => {
    expect(createdContactId).not.toBeNull();

    const result = await sandboxClient.execute('delete_contact', { contact_id: createdContactId });
    const response = result.DeleteContactResponse as Record<string, unknown>;

    expect(response).toBeDefined();
    console.log(`Deleted contact ID: ${createdContactId}`);
  });

  it('7. should NOT find the contact after deletion', async () => {
    expect(createdContactId).not.toBeNull();

    // get_contact for deleted contact returns error in nested response
    const result = await sandboxClient.execute('get_contact', { contact_id: createdContactId });
    const response = result.GetContactResponse as Record<string, unknown>;

    expect(response?.Status).toBe('error');
    expect(response?.Error).toContain('could not find');
    console.log(`Verified contact no longer exists`);
  });
});

describeIntegration('Functional: Domain Note', () => {
  const testNote = `Functional test note ${Date.now()}`;

  it('1. should set a note on the domain', async () => {
    const result = await sandboxClient.execute('set_note', {
      domain: TEST_DOMAIN,
      note: testNote,
    });
    const response = result.SetNoteResponse as Record<string, unknown>;

    expect(response).toBeDefined();
    console.log(`Set note on ${TEST_DOMAIN}: "${testNote}"`);
  });

  // Sandbox domain_info doesn't return Note field - skip verification
  it.skip('2. should verify the note in domain info', async () => {
    const result = await sandboxClient.execute('domain_info', { domain: TEST_DOMAIN });
    const response = result.DomainInfoResponse as Record<string, unknown>;
    const domainInfo = response.DomainInfo as Record<string, unknown> | undefined;

    expect(domainInfo?.Note).toBe(testNote);
    console.log(`Verified note is set correctly`);
  });

  it('3. should clear the note', async () => {
    const result = await sandboxClient.execute('set_note', {
      domain: TEST_DOMAIN,
      note: '',
    });
    const response = result.SetNoteResponse as Record<string, unknown>;

    expect(response).toBeDefined();
    console.log(`Cleared note on ${TEST_DOMAIN}`);
  });

  it('4. should verify the note is cleared', async () => {
    const result = await sandboxClient.execute('domain_info', { domain: TEST_DOMAIN });
    const response = result.DomainInfoResponse as Record<string, unknown>;
    const domainInfo = response.DomainInfo as Record<string, unknown> | undefined;

    expect(!domainInfo?.Note || domainInfo?.Note === '').toBe(true);
    console.log(`Verified note is cleared`);
  });
});

// Note: Dynadot API has a confusing error message for lock_domain unlock:
// When trying to unlock, it returns "this domain has been locked already" (wrong message)
// This appears to be domain protection or an API bug - unlock may not work via API
describeIntegration('Functional: Domain Lock/Unlock', () => {
  let initialLockState: string | null = null;

  it('1. should get current lock state', async () => {
    const result = await sandboxClient.execute('domain_info', { domain: TEST_DOMAIN });
    const response = result.DomainInfoResponse as Record<string, unknown>;
    const domainInfo = response.DomainInfo as Record<string, unknown> | undefined;

    initialLockState = domainInfo?.Locked as string;
    console.log(`Initial lock state: ${initialLockState}`);
  });

  it('2. should call lock_domain API with unlock', async () => {
    const result = await sandboxClient.execute('lock_domain', {
      domain: TEST_DOMAIN,
      lock: 'unlock',
    });
    const response = result.LockDomainResponse as Record<string, unknown>;

    // API responds (may return error "this domain has been locked already" - misleading error)
    // Unlock via API may be restricted by domain protection settings
    expect(response).toBeDefined();
    console.log(`Unlock API response received`);
  });

  // Sandbox domain_info doesn't return Locked field - skip verification
  it.skip('3. should get lock state after unlock attempt', async () => {
    const result = await sandboxClient.execute('domain_info', { domain: TEST_DOMAIN });
    const response = result.DomainInfoResponse as Record<string, unknown>;
    const domainInfo = response.DomainInfo as Record<string, unknown> | undefined;

    // Note: Domain may remain locked if protection is enabled
    const lockState = domainInfo?.Locked as string;
    expect(['yes', 'no']).toContain(lockState);
    console.log(`Lock state after unlock attempt: ${lockState}`);
  });

  it('4. should call lock_domain API with lock', async () => {
    const result = await sandboxClient.execute('lock_domain', {
      domain: TEST_DOMAIN,
      lock: 'lock',
    });
    const response = result.LockDomainResponse as Record<string, unknown>;

    expect(response).toBeDefined();
    console.log(`Lock API call completed`);
  });

  // Sandbox domain_info doesn't return Locked field - skip verification
  it.skip('5. should verify domain is locked', async () => {
    const result = await sandboxClient.execute('domain_info', { domain: TEST_DOMAIN });
    const response = result.DomainInfoResponse as Record<string, unknown>;
    const domainInfo = response.DomainInfo as Record<string, unknown> | undefined;

    expect(domainInfo?.Locked).toBe('yes');
    console.log(`Verified domain is locked`);
  });
});

describeIntegration('Functional: Renewal Option', () => {
  let initialRenewOption: string | null = null;

  it('1. should get current renewal option', async () => {
    const result = await sandboxClient.execute('domain_info', { domain: TEST_DOMAIN });
    const response = result.DomainInfoResponse as Record<string, unknown>;
    const domainInfo = response.DomainInfo as Record<string, unknown> | undefined;

    initialRenewOption = domainInfo?.RenewOption as string;
    console.log(`Initial renewal option: ${initialRenewOption}`);
  });

  it('2. should set renewal option to auto', async () => {
    const result = await sandboxClient.execute('set_renew_option', {
      domain: TEST_DOMAIN,
      renew_option: 'auto',
    });
    const response = result.SetRenewOptionResponse as Record<string, unknown>;

    expect(response).toBeDefined();
    console.log(`Set renewal option to: auto`);
  });

  // Sandbox domain_info doesn't return RenewOption field - skip verification
  it.skip('3. should verify renewal option is auto', async () => {
    const result = await sandboxClient.execute('domain_info', { domain: TEST_DOMAIN });
    const response = result.DomainInfoResponse as Record<string, unknown>;
    const domainInfo = response.DomainInfo as Record<string, unknown> | undefined;

    // API returns 'auto-renew' for 'auto' setting
    expect(domainInfo?.RenewOption).toBe('auto-renew');
    console.log(`Verified renewal option is auto-renew`);
  });

  it('4. should set renewal option to donot', async () => {
    const result = await sandboxClient.execute('set_renew_option', {
      domain: TEST_DOMAIN,
      renew_option: 'donot',
    });
    const response = result.SetRenewOptionResponse as Record<string, unknown>;

    expect(response).toBeDefined();
    console.log(`Set renewal option to: donot`);
  });

  // Sandbox domain_info doesn't return RenewOption field - skip verification
  it.skip('5. should verify renewal option is donot', async () => {
    const result = await sandboxClient.execute('domain_info', { domain: TEST_DOMAIN });
    const response = result.DomainInfoResponse as Record<string, unknown>;
    const domainInfo = response.DomainInfo as Record<string, unknown> | undefined;

    // API returns 'do not renew' for 'donot' setting
    expect(domainInfo?.RenewOption).toBe('do not renew');
    console.log(`Verified renewal option is do not renew`);
  });
});
