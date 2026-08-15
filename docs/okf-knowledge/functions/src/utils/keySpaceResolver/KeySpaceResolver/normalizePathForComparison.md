---
type: TypeScript Method
title: normalizePathForComparison
resource: src/utils/keySpaceResolver.ts#L218-L221
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/test/suite/keySpaceResolver/test/normalize
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/suite/keySpaceResolver/test/normalize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/isPathWithinWorkspace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractTopicReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private normalizePathForComparison(fsPath: string): string`

# Calls

- [normalize](../../../../../functions/src/test/suite/keySpaceResolver/test/normalize.md)

# Called by

- [normalize](../../../../../functions/src/test/suite/keySpaceResolver/test/normalize.md)
- [isPathWithinWorkspace](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/isPathWithinWorkspace.md)
- [extractTopicReferences](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractTopicReferences.md)
- [resolveKey](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKey.md)