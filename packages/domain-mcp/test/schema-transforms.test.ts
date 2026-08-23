import { describe, expect, it } from 'vitest';
import { accountTool } from '../src/schemas/account.js';
import { aftermarketTool } from '../src/schemas/aftermarket.js';
import type { ActionDefinition, CompositeTool } from '../src/schemas/common.js';
import { tx } from '../src/schemas/common.js';
import { contactTool } from '../src/schemas/contact.js';
import { dnsTool } from '../src/schemas/dns.js';
import { domainTool } from '../src/schemas/domain.js';
import { domainSettingsTool } from '../src/schemas/domain-settings.js';
import { folderTool } from '../src/schemas/folder.js';
import { orderTool } from '../src/schemas/order.js';
import { transferTool } from '../src/schemas/transfer.js';

function action(tool: CompositeTool, name: string): ActionDefinition {
  const definition = tool.actions[name];
  if (!definition) throw new Error(`Missing ${tool.name}.${name}`);
  return definition;
}

function transform(tool: CompositeTool, name: string, input: Record<string, unknown>) {
  const definition = action(tool, name);
  if (!definition.transform) throw new Error(`Missing transform for ${tool.name}.${name}`);
  return definition.transform(name, input);
}

describe('schema action transforms', () => {
  it('transforms domain searches, registration, and renewal inputs', () => {
    expect(transform(domainTool, 'search', { domain: 'Example.com', showPrice: true })).toEqual({
      domain0: 'Example.com',
      show_price: '1',
    });
    expect(
      transform(domainTool, 'search', {
        domains: ['one.com', 'two.net'],
        currency: 'EUR',
      }),
    ).toEqual({ domain0: 'one.com', domain1: 'two.net', currency: 'EUR' });
    expect(() => transform(domainTool, 'search', {})).toThrow(
      'Either domain or domains parameter is required',
    );
    expect(
      transform(domainTool, 'bulk_register', {
        domains: ['one.com', 'two.net'],
        duration: 2,
      }),
    ).toEqual({ duration: 2, currency: 'USD', domain0: 'one.com', domain1: 'two.net' });
    expect(() => transform(domainTool, 'bulk_register', { domains: [], duration: 1 })).toThrow(
      'domains array is required',
    );
    expect(
      transform(domainTool, 'renew', {
        domain: 'example.com',
        duration: 3,
        currency: 'GBP',
        priceCheck: true,
      }),
    ).toEqual({ domain: 'example.com', duration: 3, currency: 'GBP', price_check: '1' });
    expect(
      transform(domainTool, 'renew', {
        domain: 'example.com',
        duration: 1,
      }),
    ).toEqual({ domain: 'example.com', duration: 1, currency: 'USD', price_check: undefined });
  });

  it('transforms domain settings and validates required domain arrays', () => {
    expect(
      transform(domainSettingsTool, 'set_privacy', {
        domains: ['one.com', 'two.com'],
        option: 'full',
      }),
    ).toEqual({ option: 'full', domain0: 'one.com', domain1: 'two.com' });
    expect(() =>
      transform(domainSettingsTool, 'set_privacy', { domains: [], option: 'off' }),
    ).toThrow('domains array is required');
    expect(
      transform(domainSettingsTool, 'set_whois', {
        domain: 'example.com',
        registrantContact: '1',
        adminContact: '2',
      }),
    ).toEqual({
      domain: 'example.com',
      registrant_contact: '1',
      admin_contact: '2',
      tech_contact: undefined,
      billing_contact: undefined,
    });
    expect(
      transform(domainSettingsTool, 'set_forwarding', {
        domain: 'example.com',
        forwardUrl: 'https://example.org',
        forwardType: 'permanent',
      }),
    ).toEqual({
      domain: 'example.com',
      forward_url: 'https://example.org',
      forward_type: 'permanent',
    });
    expect(
      transform(domainSettingsTool, 'set_hosting', {
        domain: 'example.com',
        options: { plan: 'pro', region: 'eu' },
      }),
    ).toEqual({ domain: 'example.com', plan: 'pro', region: 'eu' });
    expect(
      transform(domainSettingsTool, 'set_email_forward', {
        domain: 'example.com',
        forwardTo: 'owner@example.com',
      }),
    ).toEqual({ domain: 'example.com', forward_to: 'owner@example.com', username: '*' });
  });

  it('transforms DNS and folder record inputs', () => {
    const records = {
      mainRecords: [{ type: 'MX', value: 'mail.example.com', ttl: 300, priority: 10 }],
      subdomainRecords: [
        { subdomain: 'www', type: 'CNAME', value: 'example.com', ttl: 600, priority: 0 },
      ],
    };
    expect(transform(dnsTool, 'set', { domain: 'example.com', ...records })).toEqual({
      domain: 'example.com',
      main_record_type0: 'mx',
      main_record0: 'mail.example.com',
      main_record_ttl0: 300,
      main_recordx0: 10,
      subdomain0: 'www',
      sub_record_type0: 'cname',
      sub_record0: 'example.com',
      sub_record_ttl0: 600,
      sub_recordx0: 0,
    });
    expect(
      transform(dnsTool, 'set_dnssec', {
        domain: 'example.com',
        keyTag: 1,
        algorithm: 13,
        digestType: 2,
        digest: 'abc',
      }),
    ).toEqual({
      domain: 'example.com',
      key_tag: 1,
      algorithm: 13,
      digest_type: 2,
      digest: 'abc',
    });
    expect(transform(folderTool, 'set_dns', { folderId: 'folder-1', ...records })).toMatchObject({
      folder_id: 'folder-1',
      main_record_type0: 'mx',
      sub_record_type0: 'cname',
    });
    expect(
      transform(dnsTool, 'set', {
        domain: 'example.com',
        subdomainRecords: [
          { subdomain: 'txt', type: 'TXT', value: 'verification', priority: undefined },
        ],
      }),
    ).toEqual({
      domain: 'example.com',
      subdomain0: 'txt',
      sub_record_type0: 'txt',
      sub_record0: 'verification',
    });
    expect(
      transform(folderTool, 'set_hosting', {
        folderId: 'folder-1',
        options: { plan: 'business' },
      }),
    ).toEqual({ folder_id: 'folder-1', plan: 'business' });
  });

  it('transforms contact and account defaults', () => {
    expect(
      transform(contactTool, 'create', {
        name: 'Test User',
        email: 'test@example.com',
        phoneCc: '33',
        phoneNum: '123456789',
        address1: '1 Main St',
        city: 'Paris',
        state: 'IDF',
        zipCode: '75001',
        country: 'FR',
      }),
    ).toEqual({
      name: 'Test User',
      organization: undefined,
      email: 'test@example.com',
      phonecc: '33',
      phonenum: '123456789',
      address1: '1 Main St',
      address2: undefined,
      city: 'Paris',
      state: 'IDF',
      zip: '75001',
      country: 'FR',
    });
    expect(
      transform(contactTool, 'create_cn_audit', {
        contactId: 'contact-1',
        auditDetails: { id_type: 'passport', id_number: '123' },
      }),
    ).toEqual({ contact_id: 'contact-1', id_type: 'passport', id_number: '123' });
    expect(
      transform(contactTool, 'set_eu_setting', {
        contactId: 'contact-1',
        settings: { registrant_type: 'individual' },
      }),
    ).toEqual({ contact_id: 'contact-1', registrant_type: 'individual' });
    expect(transform(accountTool, 'set_default_hosting', { options: { plan: 'starter' } })).toEqual(
      { plan: 'starter' },
    );
    expect(
      transform(accountTool, 'set_default_dns', {
        mainRecords: [{ type: 'A', value: '192.0.2.1' }],
      }),
    ).toEqual({ main_record_type0: 'a', main_record0: '192.0.2.1' });
  });

  it('transforms aftermarket, order, and transfer operations', () => {
    expect(transform(aftermarketTool, 'auction_bid', { auctionId: 'a1', bidAmount: 42 })).toEqual({
      auction_id: 'a1',
      bid_amount: 42,
      currency: 'USD',
    });
    expect(transform(aftermarketTool, 'remove_from_sale', { domain: 'example.com' })).toEqual({
      domain: 'example.com',
    });
    expect(
      transform(orderTool, 'reseller_verification', { contactId: 'c1', status: 'verified' }),
    ).toEqual({
      contact_id: 'c1',
      status: 'verified',
    });
    expect(
      transform(transferTool, 'initiate', { domain: 'example.com', authCode: 'secret' }),
    ).toEqual({
      domain: 'example.com',
      auth: 'secret',
    });
    expect(
      transform(transferTool, 'set_auth_code', { domain: 'example.com', authCode: 'new' }),
    ).toEqual({
      domain: 'example.com',
      auth_code: 'new',
    });
  });

  it('transforms account, contact, and folder management inputs', () => {
    expect(transform(accountTool, 'set_default_whois', { contactId: 'c1' })).toEqual({
      contact_id: 'c1',
    });
    expect(transform(accountTool, 'set_default_ns', { nameservers: ['ns1.example.com'] })).toEqual({
      ns0: 'ns1.example.com',
    });
    expect(
      transform(accountTool, 'set_default_forwarding', { forwardUrl: 'https://example.com' }),
    ).toEqual({
      forward_url: 'https://example.com',
    });
    expect(
      transform(accountTool, 'set_default_stealth', { stealthUrl: 'https://example.com' }),
    ).toEqual({
      stealth_url: 'https://example.com',
    });
    expect(transform(accountTool, 'set_default_dns2', {})).toEqual({});
    expect(transform(accountTool, 'set_default_renew_option', { renewOption: 'auto' })).toEqual({
      renew_option: 'auto',
    });

    expect(transform(contactTool, 'get', { contactId: 'c1' })).toEqual({ contact_id: 'c1' });
    expect(transform(contactTool, 'edit', { contactId: 'c1', name: 'New Name' })).toMatchObject({
      contact_id: 'c1',
      name: 'New Name',
    });
    expect(transform(contactTool, 'delete', { contactId: 'c1' })).toEqual({ contact_id: 'c1' });
    expect(transform(contactTool, 'get_cn_audit_status', { contactId: 'c1' })).toEqual({
      contact_id: 'c1',
    });
    expect(
      transform(contactTool, 'set_lv_setting', { contactId: 'c1', settings: { type: 'lv' } }),
    ).toEqual({
      contact_id: 'c1',
      type: 'lv',
    });
    expect(
      transform(contactTool, 'set_lt_setting', { contactId: 'c1', settings: { type: 'lt' } }),
    ).toEqual({
      contact_id: 'c1',
      type: 'lt',
    });

    expect(transform(folderTool, 'create', { folderName: 'Important' })).toEqual({
      folder_name: 'Important',
    });
    expect(transform(folderTool, 'delete', { folderId: 'f1' })).toEqual({ folder_id: 'f1' });
    expect(transform(folderTool, 'rename', { folderId: 'f1', folderName: 'Renamed' })).toEqual({
      folder_id: 'f1',
      folder_name: 'Renamed',
    });
    expect(transform(folderTool, 'set_whois', { folderId: 'f1', contactId: 'c1' })).toEqual({
      folder_id: 'f1',
      contact_id: 'c1',
    });
    expect(
      transform(folderTool, 'set_ns', { folderId: 'f1', nameservers: ['ns1.example.com'] }),
    ).toEqual({
      folder_id: 'f1',
      ns0: 'ns1.example.com',
    });
    expect(transform(folderTool, 'set_parking', { folderId: 'f1' })).toEqual({ folder_id: 'f1' });
    expect(
      transform(folderTool, 'set_forwarding', {
        folderId: 'f1',
        forwardUrl: 'https://example.com',
      }),
    ).toEqual({
      folder_id: 'f1',
      forward_url: 'https://example.com',
    });
    expect(
      transform(folderTool, 'set_stealth', { folderId: 'f1', stealthUrl: 'https://example.com' }),
    ).toEqual({
      folder_id: 'f1',
      stealth_url: 'https://example.com',
    });
    expect(transform(folderTool, 'set_dns2', { folderId: 'f1' })).toEqual({ folder_id: 'f1' });
    expect(
      transform(folderTool, 'set_email_forward', { folderId: 'f1', email: 'a@example.com' }),
    ).toEqual({
      folder_id: 'f1',
      email: 'a@example.com',
    });
    expect(
      transform(folderTool, 'set_renew_option', { folderId: 'f1', renewOption: 'auto' }),
    ).toEqual({
      folder_id: 'f1',
      renew_option: 'auto',
    });
    expect(transform(folderTool, 'clear_settings', { folderId: 'f1' })).toEqual({
      folder_id: 'f1',
    });
  });

  it('transforms domain settings, DNS, aftermarket, order, and transfer inputs', () => {
    expect(
      transform(domainSettingsTool, 'set_ns', {
        domain: 'example.com',
        nameservers: ['ns1.example.com'],
      }),
    ).toEqual({
      domain: 'example.com',
      ns0: 'ns1.example.com',
    });
    expect(
      transform(domainSettingsTool, 'set_renew_option', {
        domain: 'example.com',
        renewOption: 'auto',
      }),
    ).toEqual({
      domain: 'example.com',
      renew_option: 'auto',
    });
    expect(
      transform(domainSettingsTool, 'set_stealth', {
        domain: 'example.com',
        stealthUrl: 'https://example.org',
      }),
    ).toMatchObject({
      domain: 'example.com',
      stealth_url: 'https://example.org',
    });
    expect(
      transform(domainSettingsTool, 'set_folder', { domain: 'example.com', folderId: 'f1' }),
    ).toEqual({
      domain: 'example.com',
      folder_id: 'f1',
    });
    expect(transform(dnsTool, 'clear_dns', { domain: 'example.com' })).toEqual({
      domain: 'example.com',
    });
    expect(transform(aftermarketTool, 'auction_details', { auctionId: 'a1' })).toEqual({
      auction_id: 'a1',
    });
    expect(transform(aftermarketTool, 'auction_bids', { auctionId: 'a1' })).toEqual({
      auction_id: 'a1',
    });
    expect(transform(aftermarketTool, 'backorder_auction_details', { auctionId: 'a1' })).toEqual({
      auction_id: 'a1',
    });
    expect(
      transform(aftermarketTool, 'backorder_auction_bid', { auctionId: 'a1', bidAmount: 5 }),
    ).toEqual({
      auction_id: 'a1',
      bid_amount: 5,
    });
    expect(transform(orderTool, 'status', { orderId: 'o1' })).toEqual({ order_id: 'o1' });
  });

  it('transforms reusable helpers for empty and populated collections', () => {
    expect(tx.domain({ domain: 'example.com' })).toEqual({ domain: 'example.com' });
    expect(tx.domains('item')({ domains: ['one.com', 'two.com'] })).toEqual({
      item0: 'one.com',
      item1: 'two.com',
    });
    expect(tx.domains('item')({})).toEqual({});
    expect(tx.nameservers({ domain: 'example.com' })).toEqual({ domain: 'example.com' });
    expect(tx.folderNs({ folderId: 'f1' })).toEqual({ folder_id: 'f1' });
    expect(tx.defaultNs({})).toEqual({});
  });
});
