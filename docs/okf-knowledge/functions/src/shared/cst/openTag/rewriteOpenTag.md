---
type: TypeScript Function
title: rewriteOpenTag
resource: src/shared/cst/openTag.ts#L23-L57
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/reuseCopy/reuseCopy
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/textTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/rawWithAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/changedElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/properties/test/rewrite
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rewriteOpenTag(source: string, el: ElementNode, oldXml: AttributePairs, newXml: AttributePairs, newName?: string): string`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [reuseCopy](../../../../../functions/src/editor/reuseCopy/reuseCopy.md)
- [textTarget](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/textTarget.md)
- [rawWithAttributes](../../../../../functions/src/shared/editor/toSource/rawWithAttributes.md)
- [changedElement](../../../../../functions/src/shared/editor/toSource/Writer/changedElement.md)
- [rewrite](../../../../../functions/src/test/shared/properties/test/rewrite.md)