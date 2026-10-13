---
type: TypeScript Method
title: local
resource: src/shared/editor/sync.ts#L47-L60
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/minimalEdit/minimalEdit
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/sync/EditSync/ack
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/flush
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`local(text: string): EditMessage | undefined`

# Calls

- [minimalEdit](../../../../../../functions/src/shared/editor/minimalEdit/minimalEdit.md)

# Called by

- [ack](../../../../../../functions/src/shared/editor/sync/EditSync/ack.md)
- [flush](../../../../../../functions/webview/editor/flush.md)