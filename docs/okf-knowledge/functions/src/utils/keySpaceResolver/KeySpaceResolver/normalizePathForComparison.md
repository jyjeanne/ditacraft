---
type: TypeScript Method
title: normalizePathForComparison
resource: src/utils/keySpaceResolver.ts#L234-L237
generated:
  by: okf-rs/0.7.0
relationships:
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
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKeyInMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/findRootMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/chooseRootMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/referencedFiles
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private normalizePathForComparison(fsPath: string): string`

# Called by

- [normalize](../../../../../functions/src/test/suite/keySpaceResolver/test/normalize.md)
- [isPathWithinWorkspace](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/isPathWithinWorkspace.md)
- [extractTopicReferences](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractTopicReferences.md)
- [resolveKeyInMap](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKeyInMap.md)
- [findRootMap](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/findRootMap.md)
- [chooseRootMap](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/chooseRootMap.md)
- [referencedFiles](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/referencedFiles.md)