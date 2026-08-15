---
type: TypeScript Function
title: extractTextContent
resource: server/src/features/symbols.ts#L196-L202
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/symbols/buildSymbolTree
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/symbols/extractWorkspaceSymbols
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function extractTextContent(text: string, startOffset: number): string`

# Called by

- [buildSymbolTree](../../../../../functions/server/src/features/symbols/buildSymbolTree.md)
- [extractWorkspaceSymbols](../../../../../functions/server/src/features/symbols/extractWorkspaceSymbols.md)