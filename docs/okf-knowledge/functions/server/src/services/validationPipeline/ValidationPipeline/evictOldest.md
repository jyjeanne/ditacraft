---
type: TypeScript Method
title: evictOldest
resource: server/src/services/validationPipeline.ts#L259-L276
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/setCache
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private evictOldest(): void`

# Calls

- [entries](../../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [setCache](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/setCache.md)