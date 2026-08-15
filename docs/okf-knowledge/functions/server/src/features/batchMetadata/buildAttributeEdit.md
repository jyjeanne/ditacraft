---
type: TypeScript Function
title: buildAttributeEdit
resource: server/src/features/batchMetadata.ts#L90-L119
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/escapeRegex
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/batchMetadata/escapeXmlAttrValue
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/batchMetadata/processFile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildAttributeEdit( root: RootElementInfo, content: string, attribute: string, value: string ): TextEdit | undefined`

# Calls

- [escapeRegex](../../../../../functions/server/src/utils/textUtils/escapeRegex.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)
- [escapeXmlAttrValue](../../../../../functions/server/src/features/batchMetadata/escapeXmlAttrValue.md)

# Called by

- [processFile](../../../../../functions/server/src/features/batchMetadata/processFile.md)