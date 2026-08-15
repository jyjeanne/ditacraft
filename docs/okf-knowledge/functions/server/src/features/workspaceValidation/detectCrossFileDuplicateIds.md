---
type: TypeScript Function
title: detectCrossFileDuplicateIds
resource: server/src/features/workspaceValidation.ts#L77-L115
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/workspaceValidation/extractRootId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
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

`function detectCrossFileDuplicateIds( text: string, documentPath: string, rootIdIndex: Map<string, string[]> ): Diagnostic[]`

# Calls

- [extractRootId](../../../../../functions/server/src/features/workspaceValidation/extractRootId.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)
- [t](../../../../../functions/server/src/utils/i18n/t.md)

# Called by

- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)