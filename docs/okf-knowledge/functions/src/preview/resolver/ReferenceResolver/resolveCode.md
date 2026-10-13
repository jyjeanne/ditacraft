---
type: TypeScript Method
title: resolveCode
resource: src/preview/resolver.ts#L477-L488
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/resolver/ReferenceResolver/targetPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/readText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/selectLines
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/resolveOne
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async resolveCode(el: ElementNode, docPath: string, deps: Set<string>): Promise<Resolution>`

# Calls

- [targetPath](../../../../../functions/src/preview/resolver/ReferenceResolver/targetPath.md)
- [readText](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/readText.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [selectLines](../../../../../functions/src/preview/resolver/selectLines.md)

# Called by

- [resolveOne](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveOne.md)