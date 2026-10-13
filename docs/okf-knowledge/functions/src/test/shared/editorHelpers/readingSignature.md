---
type: TypeScript Function
title: readingSignature
resource: src/test/shared/editorHelpers.ts#L17-L54
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/test/shared/editorColumnWidths/test/set
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorImages/test/apply
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorLinks/test/apply
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorMenu/test/apply
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorReuse/test/replaced
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function readingSignature(doc: PMNode, es: EditorSchema): string`

# Called by

- [set](../../../../../functions/src/test/shared/editorColumnWidths/test/set.md)
- [apply](../../../../../functions/src/test/shared/editorImages/test/apply.md)
- [apply](../../../../../functions/src/test/shared/editorLinks/test/apply.md)
- [apply](../../../../../functions/src/test/shared/editorMenu/test/apply.md)
- [replaced](../../../../../functions/src/test/shared/editorReuse/test/replaced.md)