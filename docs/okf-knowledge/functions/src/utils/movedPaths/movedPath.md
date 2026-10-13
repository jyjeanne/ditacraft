---
type: TypeScript Function
title: movedPath
resource: src/utils/movedPaths.ts#L21-L32
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/followActiveDitavalMove
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/followDitavalMoves
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/pathSettings/followPathSettings
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function movedPath(filePath: string, moves: readonly PathMove[]): string | undefined`

# Calls

- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [followActiveDitavalMove](../../../../functions/src/commands/previewCommand/followActiveDitavalMove.md)
- [followDitavalMoves](../../../../functions/src/commands/publishProfilesCommand/followDitavalMoves.md)
- [followPathSettings](../../../../functions/src/utils/pathSettings/followPathSettings.md)