---
type: TypeScript Method
title: markTags
resource: src/shared/editor/toSource.ts#L730-L738
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/raw
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/inline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private markTags(mark: Mark): { open: string; close: string }`

# Calls

- [raw](../../../../../../functions/src/shared/editor/toSource/Writer/raw.md)

# Called by

- [inline](../../../../../../functions/src/shared/editor/toSource/Writer/inline.md)