---
type: TypeScript Function
title: createRateLimiter
resource: src/utils/rateLimiter.ts#L232-L236
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/validateCommand/initializeValidator
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function createRateLimiter( type: keyof typeof RATE_LIMIT_DEFAULTS ): RateLimiter`

# Called by

- [initializeValidator](../../../../functions/src/commands/validateCommand/initializeValidator.md)