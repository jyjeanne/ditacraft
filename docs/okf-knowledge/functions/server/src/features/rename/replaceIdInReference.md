---
type: TypeScript Function
title: replaceIdInReference
resource: server/src/features/rename.ts#L264-L295
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/rename/collectMatchingEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function replaceIdInReference( type: string, value: string, oldId: string, newId: string ): string`

# Called by

- [collectMatchingEdits](../../../../../functions/server/src/features/rename/collectMatchingEdits.md)