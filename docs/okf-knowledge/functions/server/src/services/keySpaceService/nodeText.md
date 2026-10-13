---
type: TypeScript Function
title: nodeText
resource: server/src/services/keySpaceService.ts#L151-L164
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/collect
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractMetadataFromNode
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function nodeText(node: unknown): string`

# Calls

- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [collect](../../../../../functions/src/preview/resolver/ReferenceResolver/collect.md)

# Called by

- [extractMetadataFromNode](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractMetadataFromNode.md)