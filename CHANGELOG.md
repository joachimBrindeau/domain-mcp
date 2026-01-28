# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.3] - 2026-01-16

### Changed
- **Major refactoring for maintainability**: Split monolithic `schema.ts` (1,128 lines) into 12 modular schema files
  - `schemas/common.ts`: Shared types, parameters, and transform helpers
  - `schemas/domain.ts`: Domain operations
  - `schemas/domain-settings.ts`: Domain configuration
  - `schemas/dns.ts`: DNS management
  - `schemas/nameserver.ts`: Nameserver glue records
  - `schemas/transfer.ts`: Domain transfers
  - `schemas/contact.ts`: WHOIS contacts
  - `schemas/folder.ts`: Folder management
  - `schemas/account.ts`: Account & defaults
  - `schemas/aftermarket.ts`: Auctions & marketplace
  - `schemas/order.ts`: Orders & coupons
  - `schemas/index.ts`: Export aggregator
- Reorganized project structure following best practices:
  - Reduced root directory items from 22 to 15 (cleaner project root)
  - Moved documentation files to `docs/` directory
  - Moved project images to `docs/images/`
  - Consolidated configuration files to `.config/` directory
- Improved code quality with DRY principles:
  - Extracted `processDnsRecords` helper to eliminate 3 duplicate implementations
  - Extracted `settingsTransform` helper in contact.ts
  - Removed unused exports following YAGNI principle

### Fixed
- Fixed unresolved import in `scripts/test-with-claude-code.ts`
- Updated image paths in README.md after directory reorganization

### Improved
- Zero circular dependencies (verified with madge)
- Zero TypeScript errors
- Zero ESLint errors
- Improved maintainability with smaller, focused files (largest file now 217 lines vs 1,128)
- Better separation of concerns across schema modules

## [1.0.2] - 2025-12-06

### Fixed
- Added missing `bin` field to package.json for npx support
- NPX installation now works correctly: `npx -y domain-mcp`

### Changed
- Server name updated from 'dynadot' to 'domain-mcp' for consistency
- SEO improvements to README and documentation

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
- Initial release of Domain MCP server
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

[Unreleased]: https://github.com/joachimBrindeau/domain-mcp/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/joachimBrindeau/domain-mcp/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/joachimBrindeau/domain-mcp/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/joachimBrindeau/domain-mcp/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/joachimBrindeau/domain-mcp/releases/tag/v1.0.0
