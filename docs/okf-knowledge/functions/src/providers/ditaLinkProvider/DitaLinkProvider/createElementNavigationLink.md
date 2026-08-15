---
type: TypeScript Method
title: createElementNavigationLink
resource: src/providers/ditaLinkProvider.ts#L769-L780
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private createElementNavigationLink( range: vscode.Range, targetUri: vscode.Uri, elementPath: string, tooltip: string ): vscode.DocumentLink`

# Called by

- [processConrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConrefAttributes.md)
- [processXrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes.md)
- [processLinkAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes.md)