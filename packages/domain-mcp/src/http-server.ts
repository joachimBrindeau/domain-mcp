import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { isIP } from 'node:net';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createDomainMcpServer } from './server.js';

const MAX_BODY_BYTES = 1024 * 1024;
const DEFAULT_SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

interface SessionState {
  transport: StreamableHTTPServerTransport;
  idleTimer: NodeJS.Timeout;
}

export interface HttpServerOptions {
  host: string;
  port: number;
  version: string;
  authToken?: string;
  allowUnauthenticated?: boolean;
  allowedHosts?: string[];
  allowedOrigins?: string[];
  sessionIdleTimeoutMs?: number;
}

export interface RunningHttpServer {
  server: Server;
  url: string;
  close(): Promise<void>;
}

function jsonError(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32000, message }, id: null }));
}

function tokenMatches(actual: string, expected: string): boolean {
  const actualHash = createHash('sha256').update(actual).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function requestAuthorized(req: IncomingMessage, token: string | undefined): boolean {
  if (!token) return true;
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return false;
  return tokenMatches(header.slice(7), token);
}

function normalizedHostname(value: string): string {
  const host = value.trim().toLowerCase();
  if (host.startsWith('[')) return host.slice(1, host.indexOf(']'));
  return host.split(':', 1)[0] ?? '';
}

function requestAllowed(
  req: IncomingMessage,
  allowedHosts: ReadonlySet<string>,
  allowedOrigins: ReadonlySet<string>,
): boolean {
  const hostname = normalizedHostname(req.headers.host ?? '');
  if (!hostname || !allowedHosts.has(hostname)) return false;

  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return allowedOrigins.has(new URL(origin).origin.toLowerCase());
  } catch {
    return false;
  }
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error('Request body exceeds 1 MiB');
    chunks.push(buffer);
  }
  if (chunks.length === 0) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function defaultAllowedHosts(host: string): string[] {
  const values = new Set(['localhost', '127.0.0.1', '::1', normalizedHostname(host)]);
  return [...values].filter(Boolean);
}

function defaultAllowedOrigins(host: string, port: number): string[] {
  return defaultAllowedHosts(host).flatMap((hostname) => {
    const formatted = isIP(hostname) === 6 ? `[${hostname}]` : hostname;
    return [`http://${formatted}:${port}`, `https://${formatted}:${port}`];
  });
}

export async function startHttpServer(options: HttpServerOptions): Promise<RunningHttpServer> {
  if (!options.authToken && !options.allowUnauthenticated) {
    throw new Error(
      'DOMAIN_MCP_AUTH_TOKEN is required for HTTP mode. Use --allow-unauthenticated only for trusted loopback development.',
    );
  }
  if (options.allowUnauthenticated && !['127.0.0.1', '::1', 'localhost'].includes(options.host)) {
    throw new Error('--allow-unauthenticated may only be used with a loopback host');
  }

  const sessions = new Map<string, SessionState>();
  const sessionIdleTimeoutMs = options.sessionIdleTimeoutMs ?? DEFAULT_SESSION_IDLE_TIMEOUT_MS;
  if (!Number.isInteger(sessionIdleTimeoutMs) || sessionIdleTimeoutMs <= 0) {
    throw new Error('Session idle timeout must be a positive integer');
  }

  const removeSession = (sessionId: string): void => {
    const session = sessions.get(sessionId);
    if (!session) return;
    clearTimeout(session.idleTimer);
    sessions.delete(sessionId);
  };

  const scheduleSessionExpiry = (
    sessionId: string,
    transport: StreamableHTTPServerTransport,
  ): void => {
    const existing = sessions.get(sessionId);
    if (existing) clearTimeout(existing.idleTimer);
    const idleTimer = setTimeout(() => {
      removeSession(sessionId);
      void transport.close();
    }, sessionIdleTimeoutMs);
    idleTimer.unref();
    sessions.set(sessionId, { transport, idleTimer });
  };
  const allowedHosts = new Set(
    (options.allowedHosts?.length ? options.allowedHosts : defaultAllowedHosts(options.host)).map(
      normalizedHostname,
    ),
  );
  const allowedOrigins = new Set(
    (options.allowedOrigins?.length
      ? options.allowedOrigins
      : defaultAllowedOrigins(options.host, options.port)
    ).map((origin) => origin.toLowerCase()),
  );

  const server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`).pathname;
      if (path === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', sessions: sessions.size }));
        return;
      }
      if (path !== '/mcp') {
        jsonError(res, 404, 'Not found');
        return;
      }
      if (!requestAllowed(req, allowedHosts, allowedOrigins)) {
        jsonError(res, 403, 'Host or Origin not allowed');
        return;
      }
      if (!requestAuthorized(req, options.authToken)) {
        res.setHeader('www-authenticate', 'Bearer');
        jsonError(res, 401, 'Unauthorized');
        return;
      }

      const sessionHeader = req.headers['mcp-session-id'];
      const sessionId = Array.isArray(sessionHeader) ? sessionHeader[0] : sessionHeader;
      const session = sessionId ? sessions.get(sessionId) : undefined;
      let transport = session?.transport;
      if (sessionId && transport) scheduleSessionExpiry(sessionId, transport);

      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        if (!transport && !sessionId && isInitializeRequest(body)) {
          const newTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: randomUUID,
            onsessioninitialized: (initializedId) => {
              scheduleSessionExpiry(initializedId, newTransport);
            },
          });
          transport = newTransport;
          transport.onclose = () => {
            if (transport?.sessionId) removeSession(transport.sessionId);
          };
          await createDomainMcpServer(options.version).connect(transport);
        } else if (!transport) {
          jsonError(res, 400, 'Invalid or missing MCP session ID');
          return;
        }
        await transport.handleRequest(req, res, body);
        return;
      }

      if ((req.method === 'GET' || req.method === 'DELETE') && transport) {
        await transport.handleRequest(req, res);
        return;
      }

      jsonError(res, sessionId ? 404 : 400, 'Invalid or missing MCP session ID');
    } catch (error) {
      if (!res.headersSent) {
        jsonError(res, error instanceof SyntaxError ? 400 : 500, 'Request failed');
      }
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, options.host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : options.port;
  const displayHost = isIP(options.host) === 6 ? `[${options.host}]` : options.host;

  return {
    server,
    url: `http://${displayHost}:${port}/mcp`,
    async close() {
      const activeTransports = [...sessions.values()].map((session) => session.transport);
      for (const sessionId of sessions.keys()) removeSession(sessionId);
      await Promise.allSettled(activeTransports.map((transport) => transport.close()));
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
