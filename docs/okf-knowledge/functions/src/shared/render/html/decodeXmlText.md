---
type: TypeScript Function
title: decodeXmlText
resource: src/shared/render/html.ts#L44-L66
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkTargets/plainText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/reuseCopy
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/conditionMarks/conditionMarks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/conditionMarks/attrValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/propsSpecializations
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/flagStyle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/plain
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/referenced
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/placeInfo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/mapTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/navtitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/mapTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/plainText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/decode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/textTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/xmlAttrs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/opaqueView
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/rawWithAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/foreign/safeAttribute
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/foreign/renderForeign
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/internalSubsetEntities
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/attrText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/text
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/hidden
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/metaRows
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function decodeXmlText(raw: string, lookup?: EntityLookup, onUndeclared?: (name: string) => void): string`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [plainText](../../../../../functions/src/editor/linkTargets/plainText.md)
- [reuseCopy](../../../../../functions/src/editor/reuseCopy/reuseCopy.md)
- [conditionMarks](../../../../../functions/src/preview/conditionMarks/conditionMarks.md)
- [attrValue](../../../../../functions/src/preview/conditionMarks/attrValue.md)
- [propsSpecializations](../../../../../functions/src/preview/ditaval/propsSpecializations.md)
- [flagStyle](../../../../../functions/src/preview/ditaval/flagStyle.md)
- [plain](../../../../../functions/src/preview/mapContext/plain.md)
- [referenced](../../../../../functions/src/preview/mapContext/referenced.md)
- [placeInfo](../../../../../functions/src/preview/mapContext/placeInfo.md)
- [mapTitle](../../../../../functions/src/preview/mapContext/mapTitle.md)
- [navtitle](../../../../../functions/src/preview/mapContext/navtitle.md)
- [mapTitle](../../../../../functions/src/preview/resolver/ReferenceResolver/mapTitle.md)
- [plainText](../../../../../functions/src/preview/resolver/ReferenceResolver/plainText.md)
- [decode](../../../../../functions/src/preview/resolver/decode.md)
- [textTarget](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/textTarget.md)
- [xmlAttrs](../../../../../functions/src/shared/editor/toProseMirror/Builder/xmlAttrs.md)
- [opaqueView](../../../../../functions/src/shared/editor/toProseMirror/Builder/opaqueView.md)
- [rawWithAttributes](../../../../../functions/src/shared/editor/toSource/rawWithAttributes.md)
- [safeAttribute](../../../../../functions/src/shared/render/foreign/safeAttribute.md)
- [renderForeign](../../../../../functions/src/shared/render/foreign/renderForeign.md)
- [internalSubsetEntities](../../../../../functions/src/shared/render/html/internalSubsetEntities.md)
- [attrText](../../../../../functions/src/shared/render/toHtml/Renderer/attrText.md)
- [text](../../../../../functions/src/shared/render/toHtml/Renderer/text.md)
- [hidden](../../../../../functions/src/shared/render/toHtml/Renderer/hidden.md)
- [metaRows](../../../../../functions/src/shared/render/toHtml/metaRows.md)