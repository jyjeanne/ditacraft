---
type: TypeScript Method
title: computeLineNumber
resource: server/src/services/keySpaceService.ts#L1917-L1924
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsFromElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsRegex
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private computeLineNumber(content: string, charIndex: number): number`

# Called by

- [extractKeyDefinitionsFromElements](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsFromElements.md)
- [extractKeyDefinitionsRegex](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsRegex.md)