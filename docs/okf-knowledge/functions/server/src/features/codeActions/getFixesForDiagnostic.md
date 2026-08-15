---
type: TypeScript Function
title: getFixesForDiagnostic
resource: server/src/features/codeActions.ts#L64-L100
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/codeActions/fixMissingDoctype
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixEmptyElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingBooktitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingMainbooktitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixDuplicateId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixInvalidIdFormat
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingOtherrole
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixDeprecatedIndextermref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixDeprecatedAltAttr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingAlt
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/codeActions/handleCodeActions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getFixesForDiagnostic( diagnostic: Diagnostic, text: string, document: TextDocument ): CodeAction[]`

# Calls

- [fixMissingDoctype](../../../../../functions/server/src/features/codeActions/fixMissingDoctype.md)
- [fixMissingId](../../../../../functions/server/src/features/codeActions/fixMissingId.md)
- [fixMissingTitle](../../../../../functions/server/src/features/codeActions/fixMissingTitle.md)
- [fixEmptyElement](../../../../../functions/server/src/features/codeActions/fixEmptyElement.md)
- [fixMissingBooktitle](../../../../../functions/server/src/features/codeActions/fixMissingBooktitle.md)
- [fixMissingMainbooktitle](../../../../../functions/server/src/features/codeActions/fixMissingMainbooktitle.md)
- [fixDuplicateId](../../../../../functions/server/src/features/codeActions/fixDuplicateId.md)
- [fixInvalidIdFormat](../../../../../functions/server/src/features/codeActions/fixInvalidIdFormat.md)
- [fixMissingOtherrole](../../../../../functions/server/src/features/codeActions/fixMissingOtherrole.md)
- [fixDeprecatedIndextermref](../../../../../functions/server/src/features/codeActions/fixDeprecatedIndextermref.md)
- [fixDeprecatedAltAttr](../../../../../functions/server/src/features/codeActions/fixDeprecatedAltAttr.md)
- [fixMissingAlt](../../../../../functions/server/src/features/codeActions/fixMissingAlt.md)

# Called by

- [handleCodeActions](../../../../../functions/server/src/features/codeActions/handleCodeActions.md)