---
type: TypeScript Function
title: idConflict
resource: src/shared/editor/properties.ts#L131-L162
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/classTokens/classTokens
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/visualTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/textTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function idConflict(roots: CstNode[], target: ElementNode | undefined, id: string, classOf: (name: string) => string | undefined): boolean`

# Calls

- [classTokens](../../../../../functions/src/shared/grammar/classTokens/classTokens.md)
- [isElement](../../../../../functions/src/shared/cst/types/isElement.md)

# Called by

- [visualTarget](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/visualTarget.md)
- [textTarget](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/textTarget.md)