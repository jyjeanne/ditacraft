---
type: TypeScript Function
title: getHrefFileCompletions
resource: server/src/features/completion.ts#L526-L592
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/completion/getAttributeValueCompletions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function getHrefFileCompletions( ctx: CompletionContext, documentUri: string, workspaceFolders: readonly string[] ): Promise<CompletionItem[]>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)

# Called by

- [getAttributeValueCompletions](../../../../../functions/server/src/features/completion/getAttributeValueCompletions.md)