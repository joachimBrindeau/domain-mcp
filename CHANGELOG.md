# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2025-12-05

### Fixed
- Domain search action now accepts both `domain` (singular) and `domains` (array) parameters
- Resolves error "domains array is required for search action" when AI uses natural language

### Added
- Domain search with pricing screenshot to documentation
- Visual example showing domain availability and pricing lookup

### Improved
- Better UX for single domain searches
- Clearer documentation of pricing features

## [1.0.0] - 2024-12-05

### Added
- Initial release of Dynadot MCP server
- 10 composite tools covering 106 Dynadot API commands:
  - `dynadot_domain`: Core domain operations (list, search, register, renew, delete, info, lock, pricing)
  - `dynadot_domain_settings`: Domain configuration (nameservers, privacy, renewal, forwarding, parking, WHOIS)
  - `dynadot_dns`: DNS management (get/set DNS records, DNSSEC configuration)
  - `dynadot_nameserver`: Registered nameserver management (glue records)
  - `dynadot_transfer`: Domain transfer operations (initiate, status, auth codes, push requests)
  - `dynadot_contact`: WHOIS contact management (create, edit, delete, list, regional settings)
  - `dynadot_folder`: Folder organization (create, delete, list, configure folder-level settings)
  - `dynadot_account`: Account information and default settings
  - `dynadot_aftermarket`: Aftermarket operations (auctions, backorders, expired domains, marketplace)
  - `dynadot_order`: Order management and coupon operations
- MCP server implementation using @modelcontextprotocol/sdk v1.24.3
- Zod v4 schema validation
- Environment-based configuration (API key, sandbox mode)
- Automatic parameter validation and transformation
- Error handling with detailed error messages

[Unreleased]: https://github.com/yourusername/domain-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/domain-mcp/releases/tag/v1.0.0
