---
type: TypeScript Method
title: processHrefAttributes
resource: src/providers/ditaLinkProvider.ts#L144-L188
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReference
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/provideDocumentLinks
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private processHrefAttributes( text: string, document: vscode.TextDocument, documentDir: string, links: vscode.DocumentLink[] ): void`

# Calls

- [resolveReference](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReference.md)

# Called by

- [provideDocumentLinks](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/provideDocumentLinks.md)