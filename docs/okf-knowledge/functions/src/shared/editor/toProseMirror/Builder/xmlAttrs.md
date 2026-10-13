---
type: TypeScript Method
title: xmlAttrs
resource: src/shared/editor/toProseMirror.ts#L218-L220
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toProseMirror/Builder/attrsFor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private xmlAttrs(el: ElementNode): [string, string][]`

# Calls

- [decodeXmlText](../../../../../../functions/src/shared/render/html/decodeXmlText.md)

# Called by

- [attrsFor](../../../../../../functions/src/shared/editor/toProseMirror/Builder/attrsFor.md)