---
type: TypeScript Method
title: isBuildStale
resource: server/src/services/keySpaceService.ts#L616-L625
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
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

- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)

# Called by

- [buildKeySpace](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/buildKeySpace.md)