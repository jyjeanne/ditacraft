---
type: TypeScript Function
title: getInvalidKeyNamesFromMap
resource: server/src/features/crossRefValidation.ts#L584-L600
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/collectInvalidKeyNames
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/stripCommentsAndCodeContent
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function getInvalidKeyNamesFromMap( targetPath: string, cache: Map<string, string[] | null> ): Promise<string[]>`

# Calls

- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [readFile](../../../../../functions/webview/editor/readFile.md)
- [collectInvalidKeyNames](../../../../../functions/server/src/features/crossRefValidation/collectInvalidKeyNames.md)
- [stripCommentsAndCodeContent](../../../../../functions/server/src/utils/textUtils/stripCommentsAndCodeContent.md)

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)