---
type: TypeScript Function
title: t
resource: server/src/utils/i18n.ts#L44-L50
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/circularRefDetection/detectCircularReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateFragment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateConrefCompatibility
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/profilingValidation/validateProfilingAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/checkEntityExpansion
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateDITAStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateTopicStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateMapStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateBookmapStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateDitavalStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/checkTopicrefsWithoutHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/checkEmptyElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateIDs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/createUnusedTopicDiagnostic
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/catalogValidationService/CatalogValidationService/errorToDiagnostic
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function t(key: string, ...args: (string | number)[]): string`

# Called by

- [detectCircularReferences](../../../../../functions/server/src/features/circularRefDetection/detectCircularReferences.md)
- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [validateFragment](../../../../../functions/server/src/features/crossRefValidation/validateFragment.md)
- [validateConrefCompatibility](../../../../../functions/server/src/features/crossRefValidation/validateConrefCompatibility.md)
- [validateProfilingAttributes](../../../../../functions/server/src/features/profilingValidation/validateProfilingAttributes.md)
- [checkEntityExpansion](../../../../../functions/server/src/features/validation/checkEntityExpansion.md)
- [validateDITAStructure](../../../../../functions/server/src/features/validation/validateDITAStructure.md)
- [validateTopicStructure](../../../../../functions/server/src/features/validation/validateTopicStructure.md)
- [validateMapStructure](../../../../../functions/server/src/features/validation/validateMapStructure.md)
- [validateBookmapStructure](../../../../../functions/server/src/features/validation/validateBookmapStructure.md)
- [validateDitavalStructure](../../../../../functions/server/src/features/validation/validateDitavalStructure.md)
- [checkTopicrefsWithoutHref](../../../../../functions/server/src/features/validation/checkTopicrefsWithoutHref.md)
- [checkEmptyElements](../../../../../functions/server/src/features/validation/checkEmptyElements.md)
- [validateIDs](../../../../../functions/server/src/features/validation/validateIDs.md)
- [detectCrossFileDuplicateIds](../../../../../functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds.md)
- [createUnusedTopicDiagnostic](../../../../../functions/server/src/features/workspaceValidation/createUnusedTopicDiagnostic.md)
- [errorToDiagnostic](../../../../../functions/server/src/services/catalogValidationService/CatalogValidationService/errorToDiagnostic.md)
- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)