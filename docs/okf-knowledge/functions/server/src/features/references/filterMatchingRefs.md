---
type: TypeScript Function
title: filterMatchingRefs
resource: server/src/features/references.ts#L95-L111
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/workspaceScanner/referenceMatchesTarget
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/references/handleReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function filterMatchingRefs( refs: ReferenceOccurrence[], contextFilePath: string, normalizedTargetPath: string, keySpaceService: KeySpaceService | undefined, log?: (msg: string) => void ): Promise<ReferenceOccurrence[]>`

# Calls

- [referenceMatchesTarget](../../../../../functions/server/src/utils/workspaceScanner/referenceMatchesTarget.md)

# Called by

- [handleReferences](../../../../../functions/server/src/features/references/handleReferences.md)