---
type: TypeScript Function
title: validateDITADocument
resource: server/src/features/validation.ts#L43-L70
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/validation/checkEntityExpansion
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateXML
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateDITAStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateIDs
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/edgeCases/test/validate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/validation/test/validate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateDITADocument( textDocument: TextDocument, settings: DitaCraftSettings ): Diagnostic[]`

# Calls

- [checkEntityExpansion](../../../../../functions/server/src/features/validation/checkEntityExpansion.md)
- [validateXML](../../../../../functions/server/src/features/validation/validateXML.md)
- [validateDITAStructure](../../../../../functions/server/src/features/validation/validateDITAStructure.md)
- [validateIDs](../../../../../functions/server/src/features/validation/validateIDs.md)

# Called by

- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)
- [validate](../../../../../functions/server/test/edgeCases/test/validate.md)
- [validate](../../../../../functions/server/test/validation/test/validate.md)