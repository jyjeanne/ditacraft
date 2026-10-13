---
type: TypeScript Method
title: loadMaps
resource: src/preview/mapContexts.ts#L107-L140
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/fileCreationCommands/getWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/localMaps
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/sharedRegistry/sharedGrammarRegistry
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/workspaceText/readWorkspaceText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/mapContexts/MapContexts/places
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private loadMaps(topicPath: string): Promise<Map<string, Document>>`

# Calls

- [getWorkspaceFolder](../../../../../functions/src/commands/fileCreationCommands/getWorkspaceFolder.md)
- [localMaps](../../../../../functions/src/preview/mapContexts/localMaps.md)
- [sharedGrammarRegistry](../../../../../functions/src/preview/sharedRegistry/sharedGrammarRegistry.md)
- [readWorkspaceText](../../../../../functions/src/preview/workspaceText/readWorkspaceText.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)

# Called by

- [places](../../../../../functions/src/preview/mapContexts/MapContexts/places.md)