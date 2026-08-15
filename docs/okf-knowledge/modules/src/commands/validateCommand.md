---
type: TypeScript Module
title: validateCommand
resource: src/commands/validateCommand.ts#L1-L237
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/languageclient
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ratelimiter
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [ValidateFileResult](../../../interfaces/src/commands/validateCommand/ValidateFileResult.md)
- [initializeValidator](../../../functions/src/commands/validateCommand/initializeValidator.md)
- [validateCommand](../../../functions/src/commands/validateCommand/validateCommand.md)
- [validateViaLsp](../../../functions/src/commands/validateCommand/validateViaLsp.md)
- [showValidationSummary](../../../functions/src/commands/validateCommand/showValidationSummary.md)
- [getValidationRateLimiter](../../../functions/src/commands/validateCommand/getValidationRateLimiter.md)
- [resetValidationRateLimiter](../../../functions/src/commands/validateCommand/resetValidationRateLimiter.md)

# Imports

- `vscode`
- `path`
- `../languageClient`
- `../utils/rateLimiter`

# Member of

- [ditacraft](../../../packages/ditacraft.md)