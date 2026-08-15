---
type: TypeScript Function
title: resolveRef
resource: server/src/features/circularRefDetection.ts#L125-L142
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/circularRefDetection/isDitaFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/normalizePath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/circularRefDetection/extractFileReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolveRef( refValue: string, baseDir: string, text: string, match: RegExpExecArray, workspaceFolders: readonly string[] ): FileRef | null`

# Calls

- [isDitaFile](../../../../../functions/server/src/features/circularRefDetection/isDitaFile.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)
- [normalizePath](../../../../../functions/server/src/features/circularRefDetection/normalizePath.md)

# Called by

- [extractFileReferences](../../../../../functions/server/src/features/circularRefDetection/extractFileReferences.md)