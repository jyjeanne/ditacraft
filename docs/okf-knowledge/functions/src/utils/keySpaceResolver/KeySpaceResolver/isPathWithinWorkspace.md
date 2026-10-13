---
type: TypeScript Method
title: isPathWithinWorkspace
resource: src/utils/keySpaceResolver.ts#L245-L258
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private isPathWithinWorkspace(absolutePath: string): boolean`

# Calls

- [normalizePathForComparison](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)