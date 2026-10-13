---
type: TypeScript Method
title: getDtdContent
resource: src/utils/dtdResolver.ts#L70-L91
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/dtdResolver/DtdResolver/resolvePublicId
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public getDtdContent(publicId: string): string | null`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [resolvePublicId](../../../../../functions/src/utils/dtdResolver/DtdResolver/resolvePublicId.md)