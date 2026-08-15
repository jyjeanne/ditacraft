---
type: TypeScript Function
title: handleLinkedEditingRange
resource: server/src/features/linkedEditing.ts#L14-L48
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/linkedEditing/findTagAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/linkedEditing/findOpeningTag
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/linkedEditing/test/linked
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handleLinkedEditingRange( params: LinkedEditingRangeParams, documents: TextDocuments<TextDocument> ): LinkedEditingRanges | null`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [findTagAtOffset](../../../../../functions/server/src/features/linkedEditing/findTagAtOffset.md)
- [findOpeningTag](../../../../../functions/server/src/features/linkedEditing/findOpeningTag.md)

# Called by

- [linked](../../../../../functions/server/test/linkedEditing/test/linked.md)