/**
 * Domain and referral configuration
 * Extract these constants to make it easy to extend to other registrars in the future
 */

export const DYNADOT_DOMAIN = 'https://www.dynadot.com';
export const REFERRAL_PARAM = 's9F6L9F7U8Q9U8Z8v';

// GitHub repository URL
export const GITHUB_URL = 'https://github.com/joachimBrindeau/domain-mcp';

// Example MCP configuration for documentation
export const EXAMPLE_CONFIG = {
  mcpServers: {
    'domain-mcp': {
      command: 'npx',
      args: ['-y', 'domain-mcp'],
      env: {
        DYNADOT_API_KEY: 'your-api-key-here'
      }
    }
  }
} as const;

/**
 * Build a Dynadot URL with referral tracking
 * @param path - The path to append to the domain (with or without leading slash)
 * @returns Full URL with referral parameter
 */
export function buildDynadotUrl(path: string = ''): string {
  // Validate input
  if (path.startsWith('http://') || path.startsWith('https://')) {
    throw new Error('buildDynadotUrl expects a path, not an absolute URL');
  }

  // Clean path: ensure single leading slash, remove trailing slashes
  let cleanPath = path.trim();

  // If empty path, use root with trailing slash for cleaner URLs
  if (!cleanPath) {
    return `${DYNADOT_DOMAIN}/?${REFERRAL_PARAM}`;
  }

  cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  cleanPath = cleanPath.replace(/\/+$/, ''); // Remove trailing slashes
  cleanPath = cleanPath.replace(/\/+/g, '/'); // Replace multiple slashes with single

  // Handle existing query parameters
  const separator = cleanPath.includes('?') ? '&' : '?';

  return `${DYNADOT_DOMAIN}${cleanPath}${separator}${REFERRAL_PARAM}`;
}

// Common Dynadot URLs
export const DYNADOT_URLS = {
  home: buildDynadotUrl(),
  apiKey: buildDynadotUrl('/account/domain/setting/api.html'),
  apiCommands: buildDynadotUrl('/domain/api-commands'),
  apiHelp: buildDynadotUrl('/community/help/api'),
  domainSearch: buildDynadotUrl('/domain/search.html'),
  pricing: buildDynadotUrl('/domain/pricing'),
} as const;
