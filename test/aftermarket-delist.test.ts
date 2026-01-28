import { describe, expect, it } from 'vitest';
import { aftermarketTool } from '../src/schemas/aftermarket.js';

describe('Aftermarket Delist Action', () => {
  it('should have a remove_from_sale action', () => {
    expect(aftermarketTool.actions.remove_from_sale).toBeDefined();
  });

  it('should have correct command', () => {
    expect(aftermarketTool.actions.remove_from_sale.command).toBe('remove_domain_sale_setting');
  });
});
