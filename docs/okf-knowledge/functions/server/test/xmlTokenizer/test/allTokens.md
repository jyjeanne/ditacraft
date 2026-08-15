---
type: TypeScript Function
title: allTokens
resource: server/test/xmlTokenizer.test.ts#L11-L13
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/formatting/tokenize
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/xmlTokenizer/test/tokenTypes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/xmlTokenizer/test/firstOf
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function allTokens(input: string): Token[]`

# Calls

- [tokenize](../../../../../functions/server/src/features/formatting/tokenize.md)

# Called by

- [tokenTypes](../../../../../functions/server/test/xmlTokenizer/test/tokenTypes.md)
- [firstOf](../../../../../functions/server/test/xmlTokenizer/test/firstOf.md)