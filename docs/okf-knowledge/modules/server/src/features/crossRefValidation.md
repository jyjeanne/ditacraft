---
type: TypeScript Module
title: crossRefValidation
resource: server/src/features/crossRefValidation.ts#L1-L852
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/vscode-languageserver-node
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-keyspaceservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-referenceparser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/data-ditaspecialization
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-i18n
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [validateCrossReferences](../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [isInStartTag](../../../../functions/server/src/features/crossRefValidation/isInStartTag.md)
- [getScopeValue](../../../../functions/server/src/features/crossRefValidation/getScopeValue.md)
- [getAttributeValue](../../../../functions/server/src/features/crossRefValidation/getAttributeValue.md)
- [getContainingTag](../../../../functions/server/src/features/crossRefValidation/getContainingTag.md)
- [isExternalScope](../../../../functions/server/src/features/crossRefValidation/isExternalScope.md)
- [validateFragment](../../../../functions/server/src/features/crossRefValidation/validateFragment.md)
- [isInvalidKeyName](../../../../functions/server/src/features/crossRefValidation/isInvalidKeyName.md)
- [isPathInsideDir](../../../../functions/server/src/features/crossRefValidation/isPathInsideDir.md)
- [collectInvalidKeyNames](../../../../functions/server/src/features/crossRefValidation/collectInvalidKeyNames.md)
- [getInvalidKeyNamesFromMap](../../../../functions/server/src/features/crossRefValidation/getInvalidKeyNamesFromMap.md)
- [appendOutsideInputDirDiagnosticsFromMap](../../../../functions/server/src/features/crossRefValidation/appendOutsideInputDirDiagnosticsFromMap.md)
- [appendDitaOtChunkBuildWarnings](../../../../functions/server/src/features/crossRefValidation/appendDitaOtChunkBuildWarnings.md)
- [appendCopyToCollisionError](../../../../functions/server/src/features/crossRefValidation/appendCopyToCollisionError.md)
- [normalizeCopyToName](../../../../functions/server/src/features/crossRefValidation/normalizeCopyToName.md)
- [appendNestedNavigationMapLoadError](../../../../functions/server/src/features/crossRefValidation/appendNestedNavigationMapLoadError.md)
- [getContainingElementName](../../../../functions/server/src/features/crossRefValidation/getContainingElementName.md)
- [areConrefCompatible](../../../../functions/server/src/features/crossRefValidation/areConrefCompatible.md)
- [findTargetElementName](../../../../functions/server/src/features/crossRefValidation/findTargetElementName.md)
- [findTargetElementByIdOnly](../../../../functions/server/src/features/crossRefValidation/findTargetElementByIdOnly.md)
- [validateConrefCompatibility](../../../../functions/server/src/features/crossRefValidation/validateConrefCompatibility.md)

# Imports

- `vscode-languageserver/node`
- `path`
- `fs`
- `../services/keySpaceService`
- `../utils/referenceParser`
- `../data/ditaSpecialization`
- `../utils/i18n`
- `../utils/textUtils`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)