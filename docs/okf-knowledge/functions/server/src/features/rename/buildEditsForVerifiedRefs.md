---
type: TypeScript Function
title: buildEditsForVerifiedRefs
resource: server/src/features/rename.ts#L207-L230
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/rename/collectMatchingEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/collectMatchingKeyEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function buildEditsForVerifiedRefs( refs: ReferenceOccurrence[], content: string, verify: (ref: ReferenceOccurrence) => Promise<boolean>, rewrite: (ref: ReferenceOccurrence) => string ): Promise<TextEdit[]>`

# Called by

- [collectMatchingEdits](../../../../../functions/server/src/features/rename/collectMatchingEdits.md)
- [collectMatchingKeyEdits](../../../../../functions/server/src/features/rename/collectMatchingKeyEdits.md)