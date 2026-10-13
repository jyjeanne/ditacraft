---
type: TypeScript Function
title: uriPath
resource: src/editor/reuseCopy.ts#L197-L199
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/src/features/inlineConref/rebaseReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/rebase
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function uriPath(relative: string): string`

# Called by

- [rebaseReference](../../../../functions/server/src/features/inlineConref/rebaseReference.md)
- [rebase](../../../../functions/src/editor/reuseCopy/rebase.md)