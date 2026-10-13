---
type: TypeScript Function
title: flush
resource: webview/editor/main.ts#L724-L740
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/serializeDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sync/EditSync/local
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateStatus
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function flush(): void`

# Calls

- [serializeDocument](../../../functions/src/shared/editor/toSource/serializeDocument.md)
- [local](../../../functions/src/shared/editor/sync/EditSync/local.md)
- [updateStatus](../../../functions/webview/editor/updateStatus.md)