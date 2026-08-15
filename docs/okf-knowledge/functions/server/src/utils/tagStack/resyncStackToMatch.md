---
type: TypeScript Function
title: resyncStackToMatch
resource: server/src/utils/tagStack.ts#L20-L38
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/completion/findParentElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contentModelValidation/parseElementTree
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/folding/computeFoldingRanges
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/symbols/buildSymbolTree
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/symbols/extractWorkspaceSymbols
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resyncStackToMatch<T>( stack: T[], name: string, getName: (item: T) => string, onDiscard?: (item: T, index: number, isMatch: boolean) => void ): number`

# Called by

- [findParentElement](../../../../../functions/server/src/features/completion/findParentElement.md)
- [parseElementTree](../../../../../functions/server/src/features/contentModelValidation/parseElementTree.md)
- [computeFoldingRanges](../../../../../functions/server/src/features/folding/computeFoldingRanges.md)
- [buildSymbolTree](../../../../../functions/server/src/features/symbols/buildSymbolTree.md)
- [extractWorkspaceSymbols](../../../../../functions/server/src/features/symbols/extractWorkspaceSymbols.md)