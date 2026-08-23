import { describe, expect, it } from 'vitest';
import { createToolError } from '../src/errors.js';

describe('Structured Errors', () => {
  it('should create error with suggestions for unknown action', () => {
    const error = createToolError('unknown_action', {
      type: 'UNKNOWN_ACTION',
      action: 'locks',
      validActions: ['lock', 'unlock', 'list'],
      tool: 'domain',
    });

    expect(error.suggestions).toContain("Did you mean 'lock'?");
    expect(error.validActions).toEqual(['lock', 'unlock', 'list']);
    expect(JSON.parse(error.toJSON()).error.suggestions).toEqual(["Did you mean 'lock'?"]);
  });

  it('should create error with docs URL', () => {
    const error = createToolError('missing_param', {
      type: 'MISSING_PARAM',
      param: 'domain',
      tool: 'domain',
    });

    expect(error.docsUrl).toContain('github.com');
  });

  it('should format error as JSON string', () => {
    const error = createToolError('api_error', {
      type: 'API_ERROR',
      message: 'Domain not found',
      tool: 'domain',
    });

    const json = JSON.parse(error.toJSON());
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('Domain not found');
  });

  it('uses the reverse prefix match for short candidate names', () => {
    const error = createToolError('unknown_action', {
      type: 'UNKNOWN_ACTION',
      action: 'abc',
      validActions: ['ab'],
      tool: 'domain',
    });

    expect(error.suggestions).toEqual(["Did you mean 'ab'?"]);
  });

  it('omits suggestions when no action is similar', () => {
    const error = createToolError('unknown_action', {
      type: 'UNKNOWN_ACTION',
      action: 'delete',
      validActions: ['lock', 'unlock'],
      tool: 'domain',
    });

    expect(error.suggestions).toEqual([]);
    expect(JSON.parse(error.toJSON()).error.suggestions).toBeUndefined();
  });

  it('does not search for suggestions without an action or valid actions', () => {
    expect(
      createToolError('unknown_action', {
        type: 'UNKNOWN_ACTION',
        validActions: ['lock'],
        tool: 'domain',
      }).suggestions,
    ).toEqual([]);
    expect(
      createToolError('unknown_action', {
        type: 'UNKNOWN_ACTION',
        action: 'lock',
        tool: 'domain',
      }).suggestions,
    ).toEqual([]);
  });
});
