---
type: TypeScript Function
title: findIdDefinition
resource: server/src/features/rename.ts#L272-L284
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/escapeRegex
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findElementByIdOffset
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/resolveUsage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findIdDefinition(text: string, id: string, topicId: string | undefined): IdAtOffset | null`

# Calls

- [escapeRegex](../../../../../functions/server/src/utils/textUtils/escapeRegex.md)
- [findElementByIdOffset](../../../../../functions/server/src/utils/referenceParser/findElementByIdOffset.md)

# Called by

- [resolveUsage](../../../../../functions/server/src/features/rename/resolveUsage.md)