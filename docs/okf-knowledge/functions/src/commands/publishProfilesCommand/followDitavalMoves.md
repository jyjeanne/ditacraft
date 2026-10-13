---
type: TypeScript Function
title: followDitavalMoves
resource: src/commands/publishProfilesCommand.ts#L47-L75
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/resolveDitavalPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/movedPaths/movedPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/storeDitavalPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerPathFollowing
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function followDitavalMoves(moves: readonly PathMove[]): Promise<number>`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [resolveDitavalPath](../../../../functions/src/commands/publishProfilesCommand/resolveDitavalPath.md)
- [movedPath](../../../../functions/src/utils/movedPaths/movedPath.md)
- [storeDitavalPath](../../../../functions/src/commands/publishProfilesCommand/storeDitavalPath.md)

# Called by

- [registerPathFollowing](../../../../functions/src/extension/registerPathFollowing.md)