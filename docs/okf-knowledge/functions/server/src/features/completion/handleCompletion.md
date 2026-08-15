---
type: TypeScript Function
title: handleCompletion
resource: server/src/features/completion.ts#L55-L92
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/detectContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getElementCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getAttributeCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getAttributeValueCompletions
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/completion/test/complete
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleCompletion( params: CompletionParams, documents: TextDocuments<TextDocument>, keySpaceService?: KeySpaceService, subjectSchemeService?: SubjectSchemeService ): Promise<CompletionItem[]>`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [detectContext](../../../../../functions/server/src/features/completion/detectContext.md)
- [getElementCompletions](../../../../../functions/server/src/features/completion/getElementCompletions.md)
- [getAttributeCompletions](../../../../../functions/server/src/features/completion/getAttributeCompletions.md)
- [getAttributeValueCompletions](../../../../../functions/server/src/features/completion/getAttributeValueCompletions.md)

# Called by

- [complete](../../../../../functions/server/test/completion/test/complete.md)