---
type: TypeScript Method
title: webviewUri
resource: src/editor/visualEditorProvider.ts#L293-L296
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/paths/isInside
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/paths/realPathSync
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private webviewUri(absolutePath: string): string | undefined`

# Calls

- [isInside](../../../../../functions/src/preview/paths/isInside.md)
- [realPathSync](../../../../../functions/src/preview/paths/realPathSync.md)