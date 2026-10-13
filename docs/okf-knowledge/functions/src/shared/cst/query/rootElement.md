---
type: TypeScript Function
title: rootElement
resource: src/shared/cst/query.ts#L70-L72
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkPicker/openLinkTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/targetsInDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/fileSummary
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/postResolved
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/grammarKeyOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/referencesTo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/submapsOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/titleOfFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveForeign
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/findTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contentLanguage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/openFileAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/withAltText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/buildFragment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/rawWithAttributes
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rootElement(doc: Document): ElementNode | undefined`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [openLinkTarget](../../../../../functions/src/editor/linkPicker/openLinkTarget.md)
- [targetsInDocument](../../../../../functions/src/editor/linkTargets/targetsInDocument.md)
- [fileSummary](../../../../../functions/src/editor/linkTargets/fileSummary.md)
- [postResolved](../../../../../functions/src/editor/visualEditorProvider/EditorSession/postResolved.md)
- [grammarKeyOf](../../../../../functions/src/editor/visualEditorProvider/EditorSession/grammarKeyOf.md)
- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)
- [referencesTo](../../../../../functions/src/preview/mapContext/referencesTo.md)
- [submapsOf](../../../../../functions/src/preview/mapContext/submapsOf.md)
- [titleOfFile](../../../../../functions/src/preview/resolver/ReferenceResolver/titleOfFile.md)
- [resolveForeign](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveForeign.md)
- [findTarget](../../../../../functions/src/preview/resolver/findTarget.md)
- [contentLanguage](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/contentLanguage.md)
- [openFileAt](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/openFileAt.md)
- [withAltText](../../../../../functions/src/shared/editor/images/withAltText.md)
- [buildFragment](../../../../../functions/src/shared/editor/toProseMirror/buildFragment.md)
- [buildDocument](../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)
- [rawWithAttributes](../../../../../functions/src/shared/editor/toSource/rawWithAttributes.md)