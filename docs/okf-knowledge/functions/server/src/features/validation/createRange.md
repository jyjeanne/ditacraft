---
type: TypeScript Function
title: createRange
resource: server/src/features/validation.ts#L765-L772
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/validation/validateXML
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateDITAStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateTopicStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateMapStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateBookmapStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateDitavalStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/checkTopicrefsWithoutHref
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function createRange(line: number, col: number, length?: number): Range`

# Called by

- [validateXML](../../../../../functions/server/src/features/validation/validateXML.md)
- [validateDITAStructure](../../../../../functions/server/src/features/validation/validateDITAStructure.md)
- [validateTopicStructure](../../../../../functions/server/src/features/validation/validateTopicStructure.md)
- [validateMapStructure](../../../../../functions/server/src/features/validation/validateMapStructure.md)
- [validateBookmapStructure](../../../../../functions/server/src/features/validation/validateBookmapStructure.md)
- [validateDitavalStructure](../../../../../functions/server/src/features/validation/validateDitavalStructure.md)
- [checkTopicrefsWithoutHref](../../../../../functions/server/src/features/validation/checkTopicrefsWithoutHref.md)