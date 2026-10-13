---
type: TypeScript Method
title: resolveKeyref
resource: src/preview/resolver.ts#L377-L411
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/resolver/decode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/splitOnce
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/glossaryText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/findTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/titleText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async resolveKeyref(el: ElementNode, docPath: string, deps: Set<string>, glossarySeen: Set<string>): Promise<Resolution>`

# Calls

- [decode](../../../../../functions/src/preview/resolver/decode.md)
- [splitOnce](../../../../../functions/src/preview/resolver/splitOnce.md)
- [glossaryText](../../../../../functions/src/preview/resolver/ReferenceResolver/glossaryText.md)
- [findTarget](../../../../../functions/src/preview/resolver/findTarget.md)
- [titleText](../../../../../functions/src/preview/resolver/ReferenceResolver/titleText.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)