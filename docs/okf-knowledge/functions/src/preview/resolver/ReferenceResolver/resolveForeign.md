---
type: TypeScript Method
title: resolveForeign
resource: src/preview/resolver.ts#L464-L475
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/resolver/ReferenceResolver/targetPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/resolveOne
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async resolveForeign(el: ElementNode, docPath: string, deps: Set<string>): Promise<Resolution>`

# Calls

- [targetPath](../../../../../functions/src/preview/resolver/ReferenceResolver/targetPath.md)
- [rootElement](../../../../../functions/src/shared/cst/query/rootElement.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [resolveOne](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveOne.md)