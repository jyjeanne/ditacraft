---
type: TypeScript Function
title: advance
resource: server/src/utils/xmlTokenizer.ts#L74-L93
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/utils/xmlTokenizer/scanName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/xmlTokenizer/scanUntil
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function advance(): string`

# Called by

- [scanName](../../../../../functions/server/src/utils/xmlTokenizer/scanName.md)
- [scanUntil](../../../../../functions/server/src/utils/xmlTokenizer/scanUntil.md)