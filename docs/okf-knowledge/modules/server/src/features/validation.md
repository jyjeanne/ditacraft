---
type: TypeScript Module
title: validation
resource: server/src/features/validation.ts#L1-L773
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode-languageserver-node
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode-languageserver-textdocument
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fast-xml-parser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/settings
    resolved_by: tree-sitter
    confidence: exact
  - target: external/data-ditaspecialization
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-diagnosticcodes
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

- [validateDITADocument](../../../../functions/server/src/features/validation/validateDITADocument.md)
- [entityRange](../../../../functions/server/src/features/validation/entityRange.md)
- [hasNonPredefinedEntityRef](../../../../functions/server/src/features/validation/hasNonPredefinedEntityRef.md)
- [checkEntityExpansion](../../../../functions/server/src/features/validation/checkEntityExpansion.md)
- [validateXML](../../../../functions/server/src/features/validation/validateXML.md)
- [validateDITAStructure](../../../../functions/server/src/features/validation/validateDITAStructure.md)
- [validateTopicStructure](../../../../functions/server/src/features/validation/validateTopicStructure.md)
- [validateMapStructure](../../../../functions/server/src/features/validation/validateMapStructure.md)
- [validateBookmapStructure](../../../../functions/server/src/features/validation/validateBookmapStructure.md)
- [validateDitavalStructure](../../../../functions/server/src/features/validation/validateDitavalStructure.md)
- [checkTopicrefsWithoutHref](../../../../functions/server/src/features/validation/checkTopicrefsWithoutHref.md)
- [checkEmptyElements](../../../../functions/server/src/features/validation/checkEmptyElements.md)
- [getEnclosingElement](../../../../functions/server/src/features/validation/getEnclosingElement.md)
- [validateIDs](../../../../functions/server/src/features/validation/validateIDs.md)
- [getFileExtension](../../../../functions/server/src/features/validation/getFileExtension.md)
- [createRange](../../../../functions/server/src/features/validation/createRange.md)

# Imports

- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `fast-xml-parser`
- `../settings`
- `../data/ditaSpecialization`
- `../utils/diagnosticCodes`
- `../utils/i18n`
- `../utils/textUtils`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)