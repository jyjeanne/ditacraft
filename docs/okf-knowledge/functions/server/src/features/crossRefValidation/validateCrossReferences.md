---
type: TypeScript Function
title: validateCrossReferences
resource: server/src/features/crossRefValidation.ts#L55-L437
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/effectiveWorkspaceFolders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/stripCommentsAndCodeContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/isInStartTag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/getScopeValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/getAttributeValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/getContainingElementName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/isPathInsideDir
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/appendOutsideInputDirDiagnosticsFromMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/getInvalidKeyNamesFromMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateConrefCompatibility
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getDuplicateKeys
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/isInvalidKeyName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/escapeRegex
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/findTargetElementByIdOnly
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/areConrefCompatible
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/appendDitaOtChunkBuildWarnings
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/appendCopyToCollisionError
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/appendNestedNavigationMapLoadError
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function validateCrossReferences( text: string, documentUri: string, keySpaceService: KeySpaceService | undefined, maxProblems: number, options?: { comparisonProfile?: 'default' | 'ditaot'; } ): Promise<Diagnostic[]>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [effectiveWorkspaceFolders](../../../../../functions/server/src/utils/textUtils/effectiveWorkspaceFolders.md)
- [getWorkspaceFolders](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders.md)
- [stripCommentsAndCodeContent](../../../../../functions/server/src/utils/textUtils/stripCommentsAndCodeContent.md)
- [isInStartTag](../../../../../functions/server/src/features/crossRefValidation/isInStartTag.md)
- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)
- [getScopeValue](../../../../../functions/server/src/features/crossRefValidation/getScopeValue.md)
- [getAttributeValue](../../../../../functions/server/src/features/crossRefValidation/getAttributeValue.md)
- [getContainingElementName](../../../../../functions/server/src/features/crossRefValidation/getContainingElementName.md)
- [isPathInsideDir](../../../../../functions/server/src/features/crossRefValidation/isPathInsideDir.md)
- [appendOutsideInputDirDiagnosticsFromMap](../../../../../functions/server/src/features/crossRefValidation/appendOutsideInputDirDiagnosticsFromMap.md)
- [getInvalidKeyNamesFromMap](../../../../../functions/server/src/features/crossRefValidation/getInvalidKeyNamesFromMap.md)
- [readFile](../../../../../functions/webview/editor/readFile.md)
- [validateConrefCompatibility](../../../../../functions/server/src/features/crossRefValidation/validateConrefCompatibility.md)
- [getDuplicateKeys](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getDuplicateKeys.md)
- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [isInvalidKeyName](../../../../../functions/server/src/features/crossRefValidation/isInvalidKeyName.md)
- [escapeRegex](../../../../../functions/server/src/utils/textUtils/escapeRegex.md)
- [findTargetElementByIdOnly](../../../../../functions/server/src/features/crossRefValidation/findTargetElementByIdOnly.md)
- [areConrefCompatible](../../../../../functions/server/src/features/crossRefValidation/areConrefCompatible.md)
- [appendDitaOtChunkBuildWarnings](../../../../../functions/server/src/features/crossRefValidation/appendDitaOtChunkBuildWarnings.md)
- [appendCopyToCollisionError](../../../../../functions/server/src/features/crossRefValidation/appendCopyToCollisionError.md)
- [appendNestedNavigationMapLoadError](../../../../../functions/server/src/features/crossRefValidation/appendNestedNavigationMapLoadError.md)

# Called by

- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)