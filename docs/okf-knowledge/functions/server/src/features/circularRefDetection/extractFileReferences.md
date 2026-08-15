---
type: TypeScript Function
title: extractFileReferences
resource: server/src/features/circularRefDetection.ts#L97-L122
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/circularRefDetection/resolveRef
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/circularRefDetection/detectCircularReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/dfsDetectAnyCycle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function extractFileReferences( text: string, baseDir: string, workspaceFolders: readonly string[] ): FileRef[]`

# Calls

- [resolveRef](../../../../../functions/server/src/features/circularRefDetection/resolveRef.md)

# Called by

- [detectCircularReferences](../../../../../functions/server/src/features/circularRefDetection/detectCircularReferences.md)
- [dfsDetectAnyCycle](../../../../../functions/server/src/features/circularRefDetection/dfsDetectAnyCycle.md)