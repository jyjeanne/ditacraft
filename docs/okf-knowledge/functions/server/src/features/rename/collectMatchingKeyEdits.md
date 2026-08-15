---
type: TypeScript Function
title: collectMatchingKeyEdits
resource: server/src/features/rename.ts#L439-L465
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/rename/buildEditsForVerifiedRefs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/extractKeyPart
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntry
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/sameKeyDefinition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/replaceKeyInReference
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/handleKeyRename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function collectMatchingKeyEdits( refs: ReferenceOccurrence[], content: string, contextFilePath: string, targetSourceMap: string, targetSourceLine: number, newKey: string, keySpaceService: KeySpaceService, targetKeyUnambiguousInOwnFile: boolean ): Promise<TextEdit[]>`

# Calls

- [buildEditsForVerifiedRefs](../../../../../functions/server/src/features/rename/buildEditsForVerifiedRefs.md)
- [extractKeyPart](../../../../../functions/server/src/utils/referenceParser/extractKeyPart.md)
- [resolveKeyEntry](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntry.md)
- [sameKeyDefinition](../../../../../functions/server/src/features/rename/sameKeyDefinition.md)
- [replaceKeyInReference](../../../../../functions/server/src/features/rename/replaceKeyInReference.md)

# Called by

- [handleKeyRename](../../../../../functions/server/src/features/rename/handleKeyRename.md)