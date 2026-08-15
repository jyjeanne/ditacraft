---
type: TypeScript Function
title: readDocOrFile
resource: server/src/features/inlineConref.ts#L129-L137
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/inlineConref/handleComputeInlineConrefEdit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function readDocOrFile(documents: TextDocuments<TextDocument>, filePath: string): Promise<string | undefined>`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [handleComputeInlineConrefEdit](../../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)