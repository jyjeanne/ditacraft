---
type: TypeScript Function
title: getKeyrefCompletions
resource: server/src/features/completion.ts#L390-L456
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/extractAllIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getAllKeys
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/completion/getAttributeValueCompletions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function getKeyrefCompletions( ctx: CompletionContext, documentUri: string, keySpaceService: KeySpaceService ): Promise<CompletionItem[]>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [readFile](../../../../../functions/webview/editor/readFile.md)
- [extractAllIds](../../../../../functions/server/src/features/completion/extractAllIds.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [getAllKeys](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getAllKeys.md)

# Called by

- [getAttributeValueCompletions](../../../../../functions/server/src/features/completion/getAttributeValueCompletions.md)