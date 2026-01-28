import { describe, expect, it } from 'vitest';
import { normalizeResponse } from '../src/normalize.js';

describe('Response Normalizer', () => {
  describe('normalizeResponse', () => {
    it('should flatten nested FolderCreateResponse', () => {
      const raw = {
        Status: 'success',
        FolderCreateResponse: {
          FolderCreateContent: {
            FolderId: '12345',
          },
        },
      };

      const result = normalizeResponse('create_folder', raw);

      expect(result).toEqual({
        success: true,
        folderId: '12345',
      });
    });

    it('should flatten DomainInfoResponse', () => {
      const raw = {
        Status: 'success',
        DomainInfoResponse: {
          DomainInfo: {
            Name: 'example.com',
            Expiration: '2025-01-28',
            Locked: 'yes',
          },
        },
      };

      const result = normalizeResponse('domain_info', raw);

      expect(result).toEqual({
        success: true,
        domain: 'example.com',
        expiration: '2025-01-28',
        locked: true,
      });
    });

    it('should pass through unknown commands with camelCase keys', () => {
      const raw = {
        Status: 'success',
        SomeResponse: {
          SomeField: 'value',
        },
      };

      const result = normalizeResponse('unknown_command', raw);

      expect(result.success).toBe(true);
      expect(result.someResponse).toBeDefined();
    });

    it('should handle error responses', () => {
      const raw = {
        Status: 'error',
        Error: 'Domain not found',
      };

      const result = normalizeResponse('domain_info', raw);

      expect(result).toEqual({
        success: false,
        error: 'Domain not found',
      });
    });
  });
});
