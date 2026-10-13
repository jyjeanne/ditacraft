---
type: TypeScript Method
title: collectXmlElements
resource: server/src/services/keySpaceService.ts#L1141-L1170
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
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/parseMapElements
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private collectXmlElements( obj: unknown, out: Array<{ tagName: string; attrs: Record<string, string>; node: Record<string, unknown> }>, tagName = '' ): void`

# Calls

- [entries](../../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [startsWith](../../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [parseMapElements](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/parseMapElements.md)