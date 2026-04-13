import { describe, expect, it } from 'vitest';
import { dnsTool } from '../src/schemas/dns.js';

describe('DNS Delete Action', () => {
  it('should have a clear_dns action', () => {
    expect(dnsTool.actions.clear_dns).toBeDefined();
  });

  it('should have correct command for clear_dns', () => {
    expect(dnsTool.actions.clear_dns.command).toBe('set_dns2');
  });

  it('should have a description for clear_dns', () => {
    expect(dnsTool.actions.clear_dns.description.toLowerCase()).toContain('clear');
  });
});
