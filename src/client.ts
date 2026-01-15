import ky, { type KyInstance } from 'ky';

/**
 * Parameters passed to Dynadot API commands.
 * Values can be string, number, boolean, or undefined (undefined values are filtered out).
 */
export type ApiParams = Record<string, string | number | boolean | undefined>;

/**
 * Standard response structure from Dynadot API.
 * All responses include a Status field ('success' or 'error').
 * Error responses include an Error field with the error message.
 * Additional fields vary by command.
 */
interface ApiResponse {
  /** Response status: 'success' or 'error' */
  Status: string;
  /** Error message (only present when Status is 'error') */
  Error?: string;
  /** Additional response fields specific to each command */
  [key: string]: unknown;
}

/**
 * Configuration options for the Dynadot client.
 */
export interface ClientConfig {
  /** API key for authentication */
  apiKey?: string;
  /** Whether to use sandbox environment */
  sandbox?: boolean;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum number of retries for failed requests (default: 3) */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  retryDelay?: number;
}

/**
 * Dynadot API client for making authenticated requests.
 * Handles API key authentication, request formatting, and error handling.
 *
 * @example
 * ```typescript
 * const client = new DynadotClient();
 * const response = await client.execute('domain_info', { domain: 'example.com' });
 * ```
 */
class DynadotClient {
  private client: KyInstance;
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;

  /**
   * Creates a new Dynadot API client.
   * Requires DYNADOT_API_KEY environment variable to be set unless provided in config.
   * Optionally uses sandbox endpoint if DYNADOT_SANDBOX=true or config.sandbox=true.
   *
   * @param config - Optional configuration for the client
   * @throws {Error} If API key is not provided via config or environment variable
   */
  constructor(config: ClientConfig = {}) {
    const apiKey = config.apiKey ?? process.env.DYNADOT_API_KEY;
    if (!apiKey) {
      throw new Error('API key required: provide via config.apiKey or DYNADOT_API_KEY env var');
    }

    this.apiKey = apiKey;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay ?? 1000;

    const sandbox = config.sandbox ?? process.env.DYNADOT_SANDBOX === 'true';
    const baseUrl = sandbox ? 'https://api-sandbox.dynadot.com' : 'https://api.dynadot.com';

    const timeout = config.timeout ?? 30000;

    this.client = ky.create({
      prefixUrl: baseUrl,
      timeout,
      retry: {
        limit: this.maxRetries,
        methods: ['get', 'post'],
        statusCodes: [408, 429, 500, 502, 503, 504],
        backoffLimit: this.retryDelay * Math.pow(2, this.maxRetries),
      },
      hooks: {
        beforeRetry: [
          async ({ retryCount }) => {
            const delay = this.retryDelay * Math.pow(2, retryCount);
            await new Promise((resolve) => setTimeout(resolve, delay));
          },
        ],
      },
    });
  }

  /**
   * Executes a Dynadot API command.
   *
   * @param command - The API command to execute (e.g., 'domain_info', 'search')
   * @param params - Command parameters (undefined values are automatically filtered)
   * @returns API response as a typed object
   * @throws {Error} If the API returns an error status
   *
   * @example
   * ```typescript
   * const response = await client.execute('domain_info', { domain: 'example.com' });
   * const searchResults = await client.execute('search', {
   *   domains: ['example.com', 'example.net'],
   *   showPrice: true
   * });
   * ```
   */
  async execute(command: string, params: ApiParams = {}): Promise<ApiResponse> {
    const searchParams = new URLSearchParams();
    searchParams.set('key', this.apiKey);
    searchParams.set('command', command);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }

    const response = await this.client.get('api3.json', { searchParams }).json<ApiResponse>();

    if (response.Status === 'error') {
      throw new Error(`Dynadot API error: ${response.Error || 'Unknown error'}`);
    }

    return response;
  }
}

// Singleton instance
let instance: DynadotClient | null = null;

/**
 * Returns a singleton instance of the Dynadot API client.
 * Creates the client on first call and reuses it for subsequent calls.
 *
 * @param config - Optional configuration for the client (only used on first call)
 * @returns The Dynadot API client instance
 * @throws {Error} If API key is not provided via config or environment variable
 *
 * @example
 * ```typescript
 * import { getClient } from './client.js';
 *
 * const client = getClient();
 * const domains = await client.execute('list_domain');
 *
 * // With custom configuration
 * const client = getClient({ maxRetries: 5, retryDelay: 2000 });
 * ```
 */
export function getClient(config?: ClientConfig): DynadotClient {
  if (!instance) {
    instance = new DynadotClient(config);
  }
  return instance;
}
