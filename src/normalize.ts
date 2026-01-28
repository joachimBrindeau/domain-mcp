type RawResponse = Record<string, unknown>;
type NormalizedResponse = Record<string, unknown>;

/**
 * Convert PascalCase to camelCase
 */
function toCamelCase(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Recursively convert all keys from PascalCase to camelCase
 */
function camelCaseKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(camelCaseKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[toCamelCase(key)] = camelCaseKeys(value);
    }
    return result;
  }
  return obj;
}

/**
 * Extract the actual content from deeply nested Dynadot responses
 */
function extractContent(raw: RawResponse): Record<string, unknown> {
  // Find the main response key (e.g., FolderCreateResponse, DomainInfoResponse)
  const responseKey = Object.keys(raw).find((k) => k.endsWith('Response') && k !== 'Status');

  if (!responseKey) {
    // No nested response, return as-is (minus Status)
    const { Status, Error: _err, ...rest } = raw;
    return rest as Record<string, unknown>;
  }

  const responseContent = raw[responseKey] as Record<string, unknown>;

  // Find the content key (e.g., FolderCreateContent, DomainInfo)
  const contentKey = Object.keys(responseContent).find(
    (k) => k.endsWith('Content') || k.endsWith('Info') || k.endsWith('List'),
  );

  if (contentKey) {
    return responseContent[contentKey] as Record<string, unknown>;
  }

  // Return the response content directly
  return responseContent;
}

/**
 * Command-specific normalizers for special handling
 */
const normalizers: Record<string, (content: Record<string, unknown>) => NormalizedResponse> = {
  create_folder: (content) => ({
    folderId: String(content.FolderId ?? content.folderId),
  }),

  domain_info: (content) => ({
    domain: content.Name ?? content.name,
    expiration: content.Expiration ?? content.expiration,
    locked: (content.Locked ?? content.locked) === 'yes',
    renewOption: content.RenewOption ?? content.renewOption,
    privacy: content.Privacy ?? content.privacy,
    nameservers: content.NameServers ?? content.nameservers,
    note: content.Note ?? content.note,
  }),

  create_contact: (content) => ({
    contactId: String(content.ContactId ?? content.contactId),
  }),

  search: (content) => {
    const results = (content.SearchResults ?? content.searchResults) as Array<{
      Domain?: string;
      domain?: string;
      Available?: string;
      available?: string;
      Price?: string;
      price?: string;
    }>;
    return {
      results: results?.map((r) => ({
        domain: r.Domain ?? r.domain,
        available: (r.Available ?? r.available) === 'yes',
        price: r.Price ?? r.price,
      })),
    };
  },
};

/**
 * Normalize a Dynadot API response into a clean, flat structure
 */
export function normalizeResponse(command: string, raw: RawResponse): NormalizedResponse {
  // Handle errors
  if (raw.Status === 'error') {
    return {
      success: false,
      error: raw.Error as string,
    };
  }

  // Apply command-specific normalizer if available
  const normalizer = normalizers[command];
  if (normalizer) {
    const content = extractContent(raw);
    return {
      success: true,
      ...normalizer(content),
    };
  }

  // Default for unknown commands: camelCase all keys, preserve structure (minus Status/Error)
  const { Status, Error: _err, ...rest } = raw;
  return {
    success: true,
    ...(camelCaseKeys(rest) as Record<string, unknown>),
  };
}
