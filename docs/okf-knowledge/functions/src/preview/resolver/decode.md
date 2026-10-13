---
type: TypeScript Function
title: decode
resource: src/preview/resolver.ts#L569-L571
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/reuseCopy/reuseCopy
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/providers/ollamaProvider/OllamaLLMProvider/stream
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/decideValues
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveMapReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveKeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/targetPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/textTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function decode(value: string): string`

# Calls

- [decodeXmlText](../../../../functions/src/shared/render/html/decodeXmlText.md)

# Called by

- [reuseCopy](../../../../functions/src/editor/reuseCopy/reuseCopy.md)
- [stream](../../../../functions/src/llm/providers/ollamaProvider/OllamaLLMProvider/stream.md)
- [decideValues](../../../../functions/src/preview/ditaval/decideValues.md)
- [resolveMapReference](../../../../functions/src/preview/resolver/ReferenceResolver/resolveMapReference.md)
- [resolveReuse](../../../../functions/src/preview/resolver/ReferenceResolver/resolveReuse.md)
- [resolveKeyref](../../../../functions/src/preview/resolver/ReferenceResolver/resolveKeyref.md)
- [resolveHref](../../../../functions/src/preview/resolver/ReferenceResolver/resolveHref.md)
- [targetPath](../../../../functions/src/preview/resolver/ReferenceResolver/targetPath.md)
- [textTarget](../../../../functions/src/properties/propertiesView/PropertiesViewProvider/textTarget.md)