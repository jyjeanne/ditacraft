---
type: TypeScript Function
title: handlePrepareRename
resource: server/src/features/rename.ts#L35-L62
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findIdAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findKeyAtOffset
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handlePrepareRename( params: PrepareRenameParams, documents: TextDocuments<TextDocument> ): Range | null`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [findIdAtOffset](../../../../../functions/server/src/utils/referenceParser/findIdAtOffset.md)
- [findKeyAtOffset](../../../../../functions/server/src/utils/referenceParser/findKeyAtOffset.md)