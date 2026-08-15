---
type: TypeScript Function
title: extractKeyPart
resource: server/src/utils/referenceParser.ts#L417-L420
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
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

- [collectMatchingKeyEdits](../../../../../functions/server/src/features/rename/collectMatchingKeyEdits.md)
- [referenceMatchesKey](../../../../../functions/server/src/utils/referenceParser/referenceMatchesKey.md)