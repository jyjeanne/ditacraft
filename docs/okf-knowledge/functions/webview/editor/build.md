---
type: TypeScript Function
title: build
resource: webview/editor/main.ts#L96-L99
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/internalSubsetEntities
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/doctypeInternalSubset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/scripts/compile-grammars/compileGrammars
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorQuickFixes/test/fixOnPage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/freshBuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/rebuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/makeQuickFix
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function build(cst: CstDocument, es: EditorSchema): { doc: PMNode; base: Base }`

# Calls

- [internalSubsetEntities](../../../functions/src/shared/render/html/internalSubsetEntities.md)
- [doctypeInternalSubset](../../../functions/src/shared/cst/query/doctypeInternalSubset.md)
- [buildDocument](../../../functions/src/shared/editor/toProseMirror/buildDocument.md)

# Called by

- [compileGrammars](../../../functions/scripts/compile-grammars/compileGrammars.md)
- [fixOnPage](../../../functions/src/test/shared/editorQuickFixes/test/fixOnPage.md)
- [freshBuild](../../../functions/webview/editor/freshBuild.md)
- [start](../../../functions/webview/editor/start.md)
- [rebuild](../../../functions/webview/editor/rebuild.md)
- [makeQuickFix](../../../functions/webview/editor/makeQuickFix.md)