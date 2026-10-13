---
type: TypeScript Method
title: byPublicId
resource: src/preview/grammarRegistry.ts#L120-L129
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/versionFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private byPublicId(publicId: string, setting: string | undefined, archVersion: string | undefined): GrammarIndexEntry | undefined`

# Calls

- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [versionFor](../../../../../functions/src/preview/grammarRegistry/versionFor.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)