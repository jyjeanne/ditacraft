---
type: TypeScript Method
title: resolveKeyInMap
resource: src/utils/keySpaceResolver.ts#L1315-L1383
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/mapContexts/MapContexts/resolveKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async resolveKeyInMap( keyName: string, rootMap: string, contextFilePath: string, scope?: string ): Promise<KeyDefinition | null>`

# Calls

- [normalizePathForComparison](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [resolveKey](../../../../../functions/src/preview/mapContexts/MapContexts/resolveKey.md)
- [resolveKey](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKey.md)