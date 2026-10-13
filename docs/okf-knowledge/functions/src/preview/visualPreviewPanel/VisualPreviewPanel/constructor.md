---
type: TypeScript Method
title: constructor
resource: src/preview/visualPreviewPanel.ts#L196-L227
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/sharedRegistry/sharedGrammarRegistry
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/labelsFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/readText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/loadDitaval
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/setDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateResources
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private constructor(private readonly panel: vscode.WebviewPanel, document: vscode.TextDocument | undefined)`

# Calls

- [sharedGrammarRegistry](../../../../../functions/src/preview/sharedRegistry/sharedGrammarRegistry.md)
- [labelsFor](../../../../../functions/src/shared/render/labels/labelsFor.md)
- [readText](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/readText.md)
- [getGlobalKeySpaceResolver](../../../../../functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver.md)
- [onMessage](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/onMessage.md)
- [registerListeners](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners.md)
- [loadDitaval](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/loadDitaval.md)
- [setDocument](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/setDocument.md)
- [updateResources](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/updateResources.md)