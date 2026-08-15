---
type: TypeScript Method
title: getDuplicateKeys
resource: server/src/services/keySpaceService.ts#L490-L500
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async getDuplicateKeys( contextFilePath: string ): Promise<Map<string, KeyDefinition[]>>`

# Called by

- [validateCrossReferences](../../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)