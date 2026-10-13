---
type: TypeScript Method
title: glossaryText
resource: src/preview/resolver.ts#L413-L437
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/resolver/findTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/resolveKeyref
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async glossaryText(def: KeyDefinitionLike, abbreviated: boolean, seen: Set<string>, deps: Set<string>): Promise<string | undefined>`

# Calls

- [findTarget](../../../../../functions/src/preview/resolver/findTarget.md)
- [isElement](../../../../../functions/src/shared/cst/types/isElement.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [resolveKeyref](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveKeyref.md)