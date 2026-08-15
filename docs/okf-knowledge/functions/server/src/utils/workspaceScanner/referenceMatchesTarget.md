---
type: TypeScript Function
title: referenceMatchesTarget
resource: server/src/utils/workspaceScanner.ts#L103-L133
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/parseReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/references/filterMatchingRefs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/collectMatchingEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/findCrossFileReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function referenceMatchesTarget( ref: ReferenceOccurrence, contextFilePath: string, normalizedTargetPath: string, keySpaceService: KeySpaceService | undefined, log?: (msg: string) => void ): Promise<boolean>`

# Calls

- [parseReference](../../../../../functions/server/src/utils/referenceParser/parseReference.md)
- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)

# Called by

- [filterMatchingRefs](../../../../../functions/server/src/features/references/filterMatchingRefs.md)
- [collectMatchingEdits](../../../../../functions/server/src/features/rename/collectMatchingEdits.md)
- [findCrossFileReferences](../../../../../functions/server/src/utils/workspaceScanner/findCrossFileReferences.md)