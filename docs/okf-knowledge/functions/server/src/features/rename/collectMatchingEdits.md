---
type: TypeScript Function
title: collectMatchingEdits
resource: server/src/features/rename.ts#L243-L259
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/rename/buildEditsForVerifiedRefs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/referenceMatchesTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/replaceIdInReference
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/handleRename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function collectMatchingEdits( refs: ReferenceOccurrence[], content: string, contextFilePath: string, normalizedTargetPath: string, oldId: string, newId: string, keySpaceService: KeySpaceService | undefined, log?: (msg: string) => void ): Promise<TextEdit[]>`

# Calls

- [buildEditsForVerifiedRefs](../../../../../functions/server/src/features/rename/buildEditsForVerifiedRefs.md)
- [referenceMatchesTarget](../../../../../functions/server/src/utils/workspaceScanner/referenceMatchesTarget.md)
- [replaceIdInReference](../../../../../functions/server/src/features/rename/replaceIdInReference.md)

# Called by

- [handleRename](../../../../../functions/server/src/features/rename/handleRename.md)