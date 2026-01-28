import { describe, expect, it } from 'vitest';
import { createToolError } from '../src/errors.js';

describe('Structured Errors', () => {
  it('should create error with suggestions for unknown action', () => {
    const error = createToolError('unknown_action', {
      type: 'UNKNOWN_ACTION',
      action: 'locks',
      validActions: ['lock', 'unlock', 'list'],
      tool: 'dynadot_domain',
    });

    expect(error.suggestions).toContain("Did you mean 'lock'?");
    expect(error.validActions).toEqual(['lock', 'unlock', 'list']);
  });

  it('should create error with docs URL', () => {
    const error = createToolError('missing_param', {
      type: 'MISSING_PARAM',
      param: 'domain',
      tool: 'dynadot_domain',
    });

    expect(error.docsUrl).toContain('github.com');
  });

  it('should format error as JSON string', () => {
    const error = createToolError('api_error', {
      type: 'API_ERROR',
      message: 'Domain not found',
      tool: 'dynadot_domain',
    });

    const json = JSON.parse(error.toJSON());
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('Domain not found');
  });
});
