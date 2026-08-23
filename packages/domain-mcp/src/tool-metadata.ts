import { z } from 'zod';
import type { ToolError } from './errors.js';

export const READ_ONLY_EXTERNAL = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

export const READ_ONLY_LOCAL = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const MIXED_EXTERNAL = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: true,
} as const;

const errorSchema = z.object({
  type: z.string().describe('Stable error category for programmatic handling.'),
  message: z.string().describe('Human-readable explanation of the failure.'),
  suggestions: z
    .array(z.string())
    .optional()
    .describe('Suggested corrective actions, when available.'),
  validActions: z
    .array(z.string())
    .optional()
    .describe('Allowed operation names when an unknown operation was requested.'),
  docsUrl: z.string().describe('Documentation URL relevant to the failed tool.'),
});

export const toolOutputSchema = {
  success: z.boolean().describe('Whether the requested operation completed successfully.'),
  data: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Structured operation result when success is true.'),
  error: errorSchema.optional().describe('Structured failure details when success is false.'),
};

type StructuredToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent: Record<string, unknown>;
  isError?: boolean;
};

export function createSuccessResult(
  data: Record<string, unknown>,
  text = JSON.stringify(data, null, 2),
): StructuredToolResult {
  const structuredContent = { success: true, data };
  return {
    content: [{ type: 'text', text }],
    structuredContent,
  };
}

export function createErrorResult(error: ToolError): StructuredToolResult {
  const structuredContent = JSON.parse(error.toJSON()) as Record<string, unknown>;
  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    isError: true,
  };
}
