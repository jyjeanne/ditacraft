---
type: TypeScript Module
title: rateLimiter
resource: src/utils/rateLimiter.ts#L1-L243
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/logger
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [RateLimitConfig](../../../interfaces/src/utils/rateLimiter/RateLimitConfig.md)
- [RateLimiter](../../../classes/src/utils/rateLimiter/RateLimiter.md)
- [constructor](../../../functions/src/utils/rateLimiter/RateLimiter/constructor.md)
- [isAllowed](../../../functions/src/utils/rateLimiter/RateLimiter/isAllowed.md)
- [tryExecute](../../../functions/src/utils/rateLimiter/RateLimiter/tryExecute.md)
- [getRemainingRequests](../../../functions/src/utils/rateLimiter/RateLimiter/getRemainingRequests.md)
- [reset](../../../functions/src/utils/rateLimiter/RateLimiter/reset.md)
- [resetAll](../../../functions/src/utils/rateLimiter/RateLimiter/resetAll.md)
- [getStats](../../../functions/src/utils/rateLimiter/RateLimiter/getStats.md)
- [cleanup](../../../functions/src/utils/rateLimiter/RateLimiter/cleanup.md)
- [dispose](../../../functions/src/utils/rateLimiter/RateLimiter/dispose.md)
- [createRateLimiter](../../../functions/src/utils/rateLimiter/createRateLimiter.md)
- [createCustomRateLimiter](../../../functions/src/utils/rateLimiter/createCustomRateLimiter.md)

# Imports

- `vscode`
- `./logger`

# Member of

- [ditacraft](../../../packages/ditacraft.md)