---
type: TypeScript Method
title: constructor
resource: src/providers/keySpaceViewProvider.ts#L20-L65
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/keySpaceViewProvider/KeySpaceItem/_buildKeyTooltip
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`constructor( label: string, public readonly kind: ItemKind, collapsible: vscode.TreeItemCollapsibleState, public readonly keyName?: string, public readonly keyDef?: KeyDefinition, public readonly usage?: KeyUsage, public readonly children?: KeySpaceItem[] )`

# Calls

- [_buildKeyTooltip](../../../../../functions/src/providers/keySpaceViewProvider/KeySpaceItem/_buildKeyTooltip.md)