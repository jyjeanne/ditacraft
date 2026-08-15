---
type: TypeScript Function
title: findOpeningTag
resource: server/src/features/linkedEditing.ts#L173-L233
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/linkedEditing/handleLinkedEditingRange
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findOpeningTag(text: string, tagName: string, beforeOffset: number): TagNameRange | null`

# Called by

- [handleLinkedEditingRange](../../../../../functions/server/src/features/linkedEditing/handleLinkedEditingRange.md)