import Bottleneck from 'bottleneck';
import ky, { type KyInstance } from 'ky';

const RESERVED_PARAM_KEYS = new Set(['key', 'command']);
const DEFAULT_REQUEST_INTERVAL_MS = 1000;
const REQUEST_LIMITERS = new Map<
  string,
  { limiter: Bottleneck; intervalMs: number }
>();

function getRequestLimiter(endpoint: string, apiKey: string, intervalMs: number): Bottleneck {
  const limiterKey = `${endpoint}:${apiKey}`;
  const existing = REQUEST_LIMITERS.get(limiterKey);
  if (existing) {
    if (existing.intervalMs !== intervalMs) {
      throw new Error(
        'Conflicting request intervals for the same Dynadot credential and endpoint',
      );
    }
    return existing.limiter;
  }
  const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: intervalMs,
  });
  REQUEST_LIMITERS.set(limiterKey, { limiter, intervalMs });
  return limiter;
}

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

function assertSuccessfulTopLevelStatus(response: ApiResponse): void {
  const status = response.Status;
  if (status === undefined) {
    throw new Error('Dynadot API error: missing top-level Status');
  }
  if (typeof status !== 'string') {
    throw new Error('Dynadot API error: malformed top-level Status');
  }
  if (status.toLowerCase() !== 'success') {
    if (status.toLowerCase() === 'error') return;
    throw new Error(`Dynadot API error: unknown top-level Status "${status}"`);
  }
}

function findApiError(value: unknown): string | null {
  if (value === null || typeof value !== 'object') return null;

  if (!Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const status = record.Status ?? record.status;
    const responseCode = record.ResponseCode ?? record.responseCode;
    const isErrorStatus = typeof status === 'string' && status.toLowerCase() === 'error';
    const isErrorCode = responseCode !== undefined && String(responseCode) !== '0';
    if (isErrorStatus || isErrorCode) {
      const message = record.Error ?? record.error ?? record.ErrorMessage ?? record.errorMessage;
      return typeof message === 'string' && message.length > 0 ? message : 'Unknown error';
    }
  }

  for (const item of Array.isArray(value) ? value : Object.values(value)) {
    const nestedError = findApiError(item);
    if (nestedError) return nestedError;
  }
  return null;
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
  /** Minimum interval between Dynadot API requests (default: 1000) */
  requestIntervalMs?: number;
}

/**
 * Dynadot API client for making authenticated requests.
 * Handles API key authentication, request formatting, and error handling.
 *
 * @example
 * ```typescript
 * const client = new DomainClient();
 * const response = await client.execute('domain_info', { domain: 'example.com' });
 * ```
 */
export class DomainClient {
  private client: KyInstance;
  private apiKey: string;
  private requestLimiter: Bottleneck;

  /**
   * Creates a new Dynadot API client.
   * Requires DYNADOT_API_KEY environment variable to be set unless provided in config.
   * Optionally uses sandbox endpoint if DYNADOT_SANDBOX=true or config.sandbox=true.
   *
   * @param config - Optional configuration for the client
   * @throws {Error} If API key is not provided via config or environment variable
   */
  constructor(config: ClientConfig = {}) {
    const sandbox = config.sandbox ?? process.env.DYNADOT_SANDBOX === 'true';

    // Use sandbox key if in sandbox mode and available, otherwise fall back to main API key
    const sandboxKey = process.env.DYNADOT_SANDBOX_KEY;
    const apiKey =
      config.apiKey || (sandbox && sandboxKey ? sandboxKey : null) || process.env.DYNADOT_API_KEY;
    if (!apiKey) {
      throw new Error('API key required: provide via config.apiKey or DYNADOT_API_KEY env var');
    }

    this.apiKey = apiKey;

    const baseUrl = sandbox ? 'https://api-sandbox.dynadot.com' : 'https://api.dynadot.com';
    this.requestLimiter = getRequestLimiter(
      baseUrl,
      apiKey,
      config.requestIntervalMs ?? DEFAULT_REQUEST_INTERVAL_MS,
    );

    const timeout = config.timeout ?? 30000;

    this.client = ky.create({
      prefix: baseUrl,
      timeout,
      retry: 0,
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
    return this.requestLimiter.schedule(async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('key', this.apiKey);
      searchParams.set('command', command);

      for (const [key, value] of Object.entries(params)) {
        if (RESERVED_PARAM_KEYS.has(key)) {
          throw new Error(`Reserved parameter "${key}" cannot be set by tool input`);
        }
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      }

      const response = await this.client.get('api3.json', { searchParams }).json<ApiResponse>();
      assertSuccessfulTopLevelStatus(response);
      const apiError = findApiError(response);
      if (apiError) throw new Error(`Dynadot API error: ${apiError}`);
      return response;
    });
  }
}

// Singleton instance
let instance: DomainClient | null = null;

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
 * const client = getClient({ requestIntervalMs: 2000 });
 * ```
 */
export function getClient(config?: ClientConfig): DomainClient {
  if (!instance) {
    instance = new DomainClient(config);
  }
  return instance;
}
