---
type: TypeScript Method
title: isBuildStale
resource: server/src/services/keySpaceService.ts#L554-L563
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/buildKeySpace
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private isBuildStale( generationAtStart: number, invalidationLogStart: number, keySpace: KeySpace, ): boolean`

# Calls

- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)

# Called by

- [buildKeySpace](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/buildKeySpace.md)