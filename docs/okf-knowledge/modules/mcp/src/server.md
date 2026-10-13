---
type: TypeScript Module
title: server
resource: mcp/src/server.ts#L1-L284
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/modelcontextprotocol-sdk-server-mcp-js
    resolved_by: tree-sitter
    confidence: exact
  - target: external/modelcontextprotocol-sdk-server-stdio-js
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/zod-v4
    resolved_by: tree-sitter
    confidence: exact
  - target: external/logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/diagnosticsstore
    resolved_by: tree-sitter
    confidence: exact
  - target: external/types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/resources-query
    resolved_by: tree-sitter
    confidence: exact
  - target: external/resources-diagnostics
    resolved_by: tree-sitter
    confidence: exact
  - target: external/resources-keys
    resolved_by: tree-sitter
    confidence: exact
  - target: external/package-json
    resolved_by: tree-sitter
    confidence: exact
  - target: external/server-src-services-catalogvalidationservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/server-src-services-rngvalidationservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/server-src-services-validationpipeline
    resolved_by: tree-sitter
    confidence: exact
  - target: external/server-src-services-keyspaceservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/server-src-services-subjectschemeservice
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [readDiagnostics](../../../functions/mcp/src/server/readDiagnostics.md)
- [readKeys](../../../functions/mcp/src/server/readKeys.md)
- [main](../../../functions/mcp/src/server/main.md)

# Imports

- `@modelcontextprotocol/sdk/server/mcp.js`
- `@modelcontextprotocol/sdk/server/stdio.js`
- `path`
- `zod/v4`
- `./logger`
- `./diagnosticsStore`
- `./types`
- `./resources/query`
- `./resources/diagnostics`
- `./resources/keys`
- `../../package.json`
- `../../server/src/services/catalogValidationService`
- `../../server/src/services/rngValidationService`
- `../../server/src/services/validationPipeline`
- `../../server/src/services/keySpaceService`
- `../../server/src/services/subjectSchemeService`

# Member of

- [ditacraft](../../../packages/ditacraft.md)