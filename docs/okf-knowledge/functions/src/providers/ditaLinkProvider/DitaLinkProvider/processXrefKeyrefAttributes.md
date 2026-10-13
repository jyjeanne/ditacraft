---
type: TypeScript Method
title: processXrefKeyrefAttributes
resource: src/providers/ditaLinkProvider.ts#L554-L615
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/provideDocumentLinks
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async processXrefKeyrefAttributes( text: string, document: vscode.TextDocument, links: vscode.DocumentLink[] ): Promise<void>`

# Calls

- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [provideDocumentLinks](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/provideDocumentLinks.md)