---
type: TypeScript Function
title: buildEditsForVerifiedRefs
resource: server/src/features/rename.ts#L427-L450
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/properties/test/rewrite
    resolved_by: tree-sitter
    confidence: exact
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

# Calls

- [rewrite](../../../../../functions/src/test/shared/properties/test/rewrite.md)

# Called by

- [collectMatchingEdits](../../../../../functions/server/src/features/rename/collectMatchingEdits.md)
- [collectMatchingKeyEdits](../../../../../functions/server/src/features/rename/collectMatchingKeyEdits.md)