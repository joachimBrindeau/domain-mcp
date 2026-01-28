const DOCS_BASE = 'https://github.com/joachimBrindeau/domain-mcp';

interface ErrorDetails {
  type: 'UNKNOWN_ACTION' | 'MISSING_PARAM' | 'API_ERROR' | 'VALIDATION_ERROR';
  action?: string;
  validActions?: string[];
  param?: string;
  message?: string;
  tool: string;
}

export class ToolError extends Error {
  type: string;
  suggestions: string[];
  validActions?: string[];
  docsUrl: string;
  tool: string;

  constructor(message: string, details: ErrorDetails) {
    // Use details.message if provided (for API_ERROR), otherwise use the message parameter
    super(details.message ?? message);
    this.type = details.type;
    this.tool = details.tool;
    this.suggestions = [];
    this.validActions = details.validActions;
    this.docsUrl = `${DOCS_BASE}#${details.tool.replace('dynadot_', '')}`;

    if (details.type === 'UNKNOWN_ACTION' && details.action && details.validActions) {
      const suggestion = this.findSimilar(details.action, details.validActions);
      if (suggestion) {
        this.suggestions.push(`Did you mean '${suggestion}'?`);
      }
    }
  }

  private findSimilar(input: string, candidates: string[]): string | null {
    // Simple prefix matching for fuzzy suggestions
    const inputLower = input.toLowerCase();
    for (const candidate of candidates) {
      if (candidate.toLowerCase().startsWith(inputLower.slice(0, 3))) {
        return candidate;
      }
      if (inputLower.startsWith(candidate.toLowerCase().slice(0, 3))) {
        return candidate;
      }
    }
    return null;
  }

  toJSON(): string {
    return JSON.stringify(
      {
        success: false,
        error: {
          type: this.type,
          message: this.message,
          suggestions: this.suggestions.length > 0 ? this.suggestions : undefined,
          validActions: this.validActions,
          docsUrl: this.docsUrl,
        },
      },
      null,
      2,
    );
  }
}

export function createToolError(message: string, details: ErrorDetails): ToolError {
  return new ToolError(message, details);
}
