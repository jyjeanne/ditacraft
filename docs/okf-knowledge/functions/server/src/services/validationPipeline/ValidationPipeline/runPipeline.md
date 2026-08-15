---
type: TypeScript Method
title: runPipeline
resource: server/src/services/validationPipeline.ts#L349-L678
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/hashSettings
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/getCached
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateDITADocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/setCache
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/formatError
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/finalizeDiagnostics
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contentModelValidation/validateContentModel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/rngValidationService/RngValidationService/setSchemaBasePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/withTimeout
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/i18n/t
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/ditaVersionDetector/detectDitaVersion
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/ditaRulesValidator/validateDitaRules
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/detectCircularReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/effectiveWorkspaceFolders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getSubjectSchemePaths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/registerSchemes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/snapshotFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/profilingValidation/validateProfilingAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/createUnusedTopicDiagnostic
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/customRulesValidator/validateCustomRules
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/validate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async runPipeline( document: TextDocument, settings: DitaCraftSettings, keySpaceService: KeySpaceService | undefined, workspace: WorkspaceContext, token: CancellationToken | undefined, phaseTimeoutMs: number, ): Promise<Diagnostic[]>`

# Calls

- [uriToPath](../../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [hashSettings](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/hashSettings.md)
- [getCached](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/getCached.md)
- [validateDITADocument](../../../../../../functions/server/src/features/validation/validateDITADocument.md)
- [setCache](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/setCache.md)
- [formatError](../../../../../../functions/server/src/services/validationPipeline/formatError.md)
- [finalizeDiagnostics](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/finalizeDiagnostics.md)
- [validateContentModel](../../../../../../functions/server/src/features/contentModelValidation/validateContentModel.md)
- [setSchemaBasePath](../../../../../../functions/server/src/services/rngValidationService/RngValidationService/setSchemaBasePath.md)
- [withTimeout](../../../../../../functions/server/src/services/validationPipeline/withTimeout.md)
- [t](../../../../../../functions/server/src/utils/i18n/t.md)
- [validateCrossReferences](../../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [detectDitaVersion](../../../../../../functions/server/src/utils/ditaVersionDetector/detectDitaVersion.md)
- [validateDitaRules](../../../../../../functions/server/src/features/ditaRulesValidator/validateDitaRules.md)
- [detectCircularReferences](../../../../../../functions/server/src/features/circularRefDetection/detectCircularReferences.md)
- [effectiveWorkspaceFolders](../../../../../../functions/server/src/utils/textUtils/effectiveWorkspaceFolders.md)
- [getWorkspaceFolders](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders.md)
- [getSubjectSchemePaths](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getSubjectSchemePaths.md)
- [registerSchemes](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/registerSchemes.md)
- [snapshotFor](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/snapshotFor.md)
- [validateProfilingAttributes](../../../../../../functions/server/src/features/profilingValidation/validateProfilingAttributes.md)
- [detectCrossFileDuplicateIds](../../../../../../functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds.md)
- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [createUnusedTopicDiagnostic](../../../../../../functions/server/src/features/workspaceValidation/createUnusedTopicDiagnostic.md)
- [validateCustomRules](../../../../../../functions/server/src/features/customRulesValidator/validateCustomRules.md)

# Called by

- [validate](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/validate.md)