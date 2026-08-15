---
type: TypeScript Function
title: isNameChar
resource: server/src/utils/xmlTokenizer.ts#L114-L118
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/xmlTokenizer/isNameStartChar
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/utils/xmlTokenizer/scanName
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isNameChar(ch: string): boolean`

# Calls

- [isNameStartChar](../../../../../functions/server/src/utils/xmlTokenizer/isNameStartChar.md)

# Called by

- [scanName](../../../../../functions/server/src/utils/xmlTokenizer/scanName.md)