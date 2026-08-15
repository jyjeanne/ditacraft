---
type: TypeScript Function
title: getHrefFragmentCompletions
resource: server/src/features/completion.ts#L468-L515
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/extractElementIdsInTopic
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/extractTopicIds
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
- [extractElementIdsInTopic](../../../../../functions/server/src/features/completion/extractElementIdsInTopic.md)
- [extractTopicIds](../../../../../functions/server/src/features/completion/extractTopicIds.md)

# Called by

- [getAttributeValueCompletions](../../../../../functions/server/src/features/completion/getAttributeValueCompletions.md)