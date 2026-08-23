import { describe, expect, it } from 'vitest';
import { buildDynadotUrl, DYNADOT_URLS } from '../src/constants.js';

describe('Dynadot URL constants', () => {
  it('publishes referral URLs with normalized paths', () => {
    expect(DYNADOT_URLS.home).toMatch(/^https:\/\/www\.dynadot\.com\/\?/);
    expect(DYNADOT_URLS.apiCommands).toMatch(
      /^https:\/\/www\.dynadot\.com\/domain\/api-commands\?/,
    );
  });

  it('rejects an absolute URL passed to the URL builder', () => {
    expect(() => buildDynadotUrl('https://example.com/path')).toThrow(
      'buildDynadotUrl expects a path, not an absolute URL',
    );
  });

  it('adds a leading slash and appends referral tracking after an existing query', () => {
    expect(buildDynadotUrl('domain/search.html?currency=USD')).toMatch(
      /^https:\/\/www\.dynadot\.com\/domain\/search\.html\?currency=USD&/,
    );
  });

  it('normalizes repeated and trailing path separators', () => {
    expect(buildDynadotUrl('//domain///pricing///')).toMatch(
      /^https:\/\/www\.dynadot\.com\/domain\/pricing\?/,
    );
  });
});
