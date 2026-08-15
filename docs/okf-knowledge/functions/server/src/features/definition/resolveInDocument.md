---
type: TypeScript Function
title: resolveInDocument
resource: server/src/features/definition.ts#L128-L140
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/findElementByIdOffset
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/definition/handleDefinition
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolveInDocument( document: TextDocument, text: string, targetId: string ): Location | null`

# Calls

- [findElementByIdOffset](../../../../../functions/server/src/utils/referenceParser/findElementByIdOffset.md)

# Called by

- [handleDefinition](../../../../../functions/server/src/features/definition/handleDefinition.md)