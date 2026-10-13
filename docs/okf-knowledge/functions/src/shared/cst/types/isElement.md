---
type: TypeScript Function
title: isElement
resource: src/shared/cst/types.ts#L104-L106
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/linkTargets/targetsInDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/fileSummary
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/reuseCopy
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reusedContent/mapRowItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/elementAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/buildDitavalFilter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/collect
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/glossaryText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/isEmpty
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/elementIndex/ElementIndex/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/elementIndex/ElementIndex/innermostContaining
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/findElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/findElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/findElementById
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/withAltText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/properties/idConflict
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/opaqueView
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/block
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/blockContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/inlineElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/viewFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/foreign/findForeignRoot
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/number
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/childByToken
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/childrenByToken
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/kids
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/needsFullRender
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/cst/test/allElements
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isElement(node: CstNode): node is ElementNode`

# Called by

- [targetsInDocument](../../../../../functions/src/editor/linkTargets/targetsInDocument.md)
- [fileSummary](../../../../../functions/src/editor/linkTargets/fileSummary.md)
- [reuseCopy](../../../../../functions/src/editor/reuseCopy/reuseCopy.md)
- [mapRowItems](../../../../../functions/src/editor/reusedContent/mapRowItems.md)
- [elementAt](../../../../../functions/src/editor/visualEditorProvider/elementAt.md)
- [buildDitavalFilter](../../../../../functions/src/preview/ditaval/buildDitavalFilter.md)
- [collect](../../../../../functions/src/preview/resolver/ReferenceResolver/collect.md)
- [glossaryText](../../../../../functions/src/preview/resolver/ReferenceResolver/glossaryText.md)
- [isEmpty](../../../../../functions/src/preview/resolver/isEmpty.md)
- [constructor](../../../../../functions/src/shared/cst/elementIndex/ElementIndex/constructor.md)
- [innermostContaining](../../../../../functions/src/shared/cst/elementIndex/ElementIndex/innermostContaining.md)
- [findElement](../../../../../functions/src/shared/cst/query/findElement.md)
- [findElements](../../../../../functions/src/shared/cst/query/findElements.md)
- [findElementById](../../../../../functions/src/shared/cst/query/findElementById.md)
- [withAltText](../../../../../functions/src/shared/editor/images/withAltText.md)
- [idConflict](../../../../../functions/src/shared/editor/properties/idConflict.md)
- [opaqueView](../../../../../functions/src/shared/editor/toProseMirror/Builder/opaqueView.md)
- [block](../../../../../functions/src/shared/editor/toProseMirror/Builder/block.md)
- [blockContent](../../../../../functions/src/shared/editor/toProseMirror/Builder/blockContent.md)
- [inlineElement](../../../../../functions/src/shared/editor/toProseMirror/Builder/inlineElement.md)
- [viewFor](../../../../../functions/src/shared/editor/toProseMirror/Builder/viewFor.md)
- [findForeignRoot](../../../../../functions/src/shared/render/foreign/findForeignRoot.md)
- [number](../../../../../functions/src/shared/render/toHtml/Renderer/number.md)
- [childByToken](../../../../../functions/src/shared/render/toHtml/Renderer/childByToken.md)
- [childrenByToken](../../../../../functions/src/shared/render/toHtml/Renderer/childrenByToken.md)
- [kids](../../../../../functions/src/shared/render/toHtml/Renderer/kids.md)
- [needsFullRender](../../../../../functions/src/shared/render/toHtml/needsFullRender.md)
- [allElements](../../../../../functions/src/test/shared/cst/test/allElements.md)