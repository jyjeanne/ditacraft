---
type: TypeScript Function
title: detectCircularReferences
resource: server/src/features/circularRefDetection.ts#L44-L87
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/extractFileReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/normalizePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/dfsDetectAnyCycle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/canonicalizeCycle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/i18n/t
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function detectCircularReferences( text: string, documentUri: string, workspaceFolders: readonly string[] = [], ): Promise<Diagnostic[]>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [extractFileReferences](../../../../../functions/server/src/features/circularRefDetection/extractFileReferences.md)
- [normalizePath](../../../../../functions/server/src/features/circularRefDetection/normalizePath.md)
- [dfsDetectAnyCycle](../../../../../functions/server/src/features/circularRefDetection/dfsDetectAnyCycle.md)
- [canonicalizeCycle](../../../../../functions/server/src/features/circularRefDetection/canonicalizeCycle.md)
- [t](../../../../../functions/server/src/utils/i18n/t.md)

# Called by

- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)