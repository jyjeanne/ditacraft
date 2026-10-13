---
type: TypeScript Function
title: followActiveDitavalMove
resource: src/commands/previewCommand.ts#L58-L67
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/movedPaths/movedPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerPathFollowing
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function followActiveDitavalMove(moves: readonly PathMove[]): boolean`

# Calls

- [movedPath](../../../../functions/src/utils/movedPaths/movedPath.md)

# Called by

- [registerPathFollowing](../../../../functions/src/extension/registerPathFollowing.md)