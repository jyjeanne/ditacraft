---
type: TypeScript Function
title: extractKeyPart
resource: server/src/utils/referenceParser.ts#L459-L462
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/src/features/rename/resolveUsage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/collectMatchingKeyEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/referenceMatchesKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function extractKeyPart(value: string): string`

# Called by

- [resolveUsage](../../../../../functions/server/src/features/rename/resolveUsage.md)
- [collectMatchingKeyEdits](../../../../../functions/server/src/features/rename/collectMatchingKeyEdits.md)
- [referenceMatchesKey](../../../../../functions/server/src/utils/referenceParser/referenceMatchesKey.md)