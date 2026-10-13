---
type: TypeScript Method
title: collect
resource: src/preview/resolver.ts#L91-L116
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/isEmpty
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/nodeText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/reuseCopy
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reusedContent/resolvedItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveIn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/carryResolutions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorReuse/test/reuseElements
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`collect(nodes: Document | ElementNode): Request[]`

# Calls

- [isElement](../../../../../functions/src/shared/cst/types/isElement.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [isEmpty](../../../../../functions/src/preview/resolver/isEmpty.md)

# Called by

- [nodeText](../../../../../functions/server/src/services/keySpaceService/nodeText.md)
- [reuseCopy](../../../../../functions/src/editor/reuseCopy/reuseCopy.md)
- [resolvedItems](../../../../../functions/src/editor/reusedContent/resolvedItems.md)
- [resolveIn](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveIn.md)
- [carryResolutions](../../../../../functions/src/preview/visualPreviewPanel/carryResolutions.md)
- [reuseElements](../../../../../functions/src/test/shared/editorReuse/test/reuseElements.md)