---
type: TypeScript Function
title: minimalEdit
resource: src/shared/editor/minimalEdit.ts#L25-L41
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/minimalEdit/alignToReference
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/sync/EditSync/local
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function minimalEdit(oldStr: string, newStr: string): SpanEdit | null`

# Calls

- [alignToReference](../../../../../functions/src/shared/editor/minimalEdit/alignToReference.md)

# Called by

- [local](../../../../../functions/src/shared/editor/sync/EditSync/local.md)