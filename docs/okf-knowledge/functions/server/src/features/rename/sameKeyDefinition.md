---
type: TypeScript Function
title: sameKeyDefinition
resource: server/src/features/rename.ts#L499-L510
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/collectMatchingKeyEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function sameKeyDefinition( resolved: KeyDefinition | null, targetSourceMap: string, targetSourceLine: number, targetKeyUnambiguousInOwnFile: boolean ): boolean`

# Calls

- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)

# Called by

- [collectMatchingKeyEdits](../../../../../functions/server/src/features/rename/collectMatchingKeyEdits.md)