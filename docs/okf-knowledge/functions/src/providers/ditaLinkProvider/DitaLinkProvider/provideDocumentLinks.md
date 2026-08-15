---
type: TypeScript Method
title: provideDocumentLinks
resource: src/providers/ditaLinkProvider.ts#L106-L139
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processHrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefKeyrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConkeyrefAttributesWithKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processKeyrefAttributesWithKeySpace
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async provideDocumentLinks( document: vscode.TextDocument, _token: vscode.CancellationToken ): Promise<vscode.DocumentLink[]>`

# Calls

- [processHrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processHrefAttributes.md)
- [processXrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes.md)
- [processXrefKeyrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefKeyrefAttributes.md)
- [processLinkAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes.md)
- [processConrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConrefAttributes.md)
- [processConkeyrefAttributesWithKeySpace](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConkeyrefAttributesWithKeySpace.md)
- [processKeyrefAttributesWithKeySpace](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processKeyrefAttributesWithKeySpace.md)