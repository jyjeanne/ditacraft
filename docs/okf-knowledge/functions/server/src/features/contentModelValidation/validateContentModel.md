---
type: TypeScript Function
title: validateContentModel
resource: server/src/features/contentModelValidation.ts#L481-L490
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/contentModelValidation/parseElementTree
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contentModelValidation/validateElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateContentModel(text: string): Diagnostic[]`

# Calls

- [parseElementTree](../../../../../functions/server/src/features/contentModelValidation/parseElementTree.md)
- [validateElement](../../../../../functions/server/src/features/contentModelValidation/validateElement.md)

# Called by

- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)