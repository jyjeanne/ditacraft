---
type: TypeScript Method
title: allowedIn
resource: src/shared/editor/commands.ts#L388-L391
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/commands/DitaCommands/blockTypesAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/setBlockType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertableAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertBlock
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/DitaCommands/insertTable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/blockTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/accepts
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/insertRelTable
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`allowedIn(parent: PMNode, child: string): boolean`

# Called by

- [blockTypesAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/blockTypesAt.md)
- [setBlockType](../../../../../../functions/src/shared/editor/commands/DitaCommands/setBlockType.md)
- [insertableAt](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertableAt.md)
- [insertBlock](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertBlock.md)
- [insertTable](../../../../../../functions/src/shared/editor/commands/DitaCommands/insertTable.md)
- [blockTarget](../../../../../../functions/src/shared/editor/images/ImageCommands/blockTarget.md)
- [accepts](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/accepts.md)
- [insertRelTable](../../../../../../functions/src/shared/editor/relTables/RelTableCommands/insertRelTable.md)