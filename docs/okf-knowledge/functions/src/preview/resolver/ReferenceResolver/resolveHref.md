---
type: TypeScript Method
title: resolveHref
resource: src/preview/resolver.ts#L441-L462
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/resolver/decode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/findTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/titleText
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async resolveHref(el: ElementNode, doc: Document, docPath: string, deps: Set<string>): Promise<Resolution | undefined>`

# Calls

- [decode](../../../../../functions/src/preview/resolver/decode.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [findTarget](../../../../../functions/src/preview/resolver/findTarget.md)
- [titleText](../../../../../functions/src/preview/resolver/ReferenceResolver/titleText.md)