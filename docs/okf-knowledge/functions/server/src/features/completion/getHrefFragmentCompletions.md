---
type: TypeScript Function
title: getHrefFragmentCompletions
resource: server/src/features/completion.ts#L469-L516
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
  - target: functions/server/src/features/completion/extractElementIdsInTopic
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/extractTopicIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/completion/getAttributeValueCompletions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function getHrefFragmentCompletions( ctx: CompletionContext, documentUri: string, workspaceFolders: readonly string[] ): Promise<CompletionItem[]>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [readFile](../../../../../functions/webview/editor/readFile.md)
- [extractElementIdsInTopic](../../../../../functions/server/src/features/completion/extractElementIdsInTopic.md)
- [extractTopicIds](../../../../../functions/server/src/features/completion/extractTopicIds.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [getAttributeValueCompletions](../../../../../functions/server/src/features/completion/getAttributeValueCompletions.md)