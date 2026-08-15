---
type: TypeScript Method
title: tryExecute
resource: src/utils/rateLimiter.ts#L121-L130
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/rateLimiter/RateLimiter/isAllowed
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async tryExecute<T>( key: string, callback: () => T | Promise<T> ): Promise<T | undefined>`

# Calls

- [isAllowed](../../../../../functions/src/utils/rateLimiter/RateLimiter/isAllowed.md)