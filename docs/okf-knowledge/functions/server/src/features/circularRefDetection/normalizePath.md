---
type: TypeScript Function
title: normalizePath
resource: server/src/features/circularRefDetection.ts#L234-L236
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/circularRefDetection/detectCircularReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/resolveRef
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/dfsDetectAnyCycle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function normalizePath(filePath: string): string`

# Calls

- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)

# Called by

- [detectCircularReferences](../../../../../functions/server/src/features/circularRefDetection/detectCircularReferences.md)
- [resolveRef](../../../../../functions/server/src/features/circularRefDetection/resolveRef.md)
- [dfsDetectAnyCycle](../../../../../functions/server/src/features/circularRefDetection/dfsDetectAnyCycle.md)