---
type: TypeScript Function
title: handleValidateFragment
resource: server/src/features/fragmentValidator.ts#L58-L110
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/fragmentValidator/wrapFragment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/settings/getDocumentSettings
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/tools/ditaValidate/handleDitaValidate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleValidateFragment( params: ValidateFragmentParams, pipeline: ValidationPipeline ): Promise<FragmentValidationResult>`

# Calls

- [wrapFragment](../../../../../functions/server/src/features/fragmentValidator/wrapFragment.md)
- [getDocumentSettings](../../../../../functions/server/src/settings/getDocumentSettings.md)

# Called by

- [handleDitaValidate](../../../../../functions/mcp/src/tools/ditaValidate/handleDitaValidate.md)