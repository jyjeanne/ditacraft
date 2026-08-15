---
type: TypeScript Method
title: processConrefAttributes
resource: src/providers/ditaLinkProvider.ts#L194-L265
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/createElementNavigationLink
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReferenceWithFragment
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/provideDocumentLinks
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private processConrefAttributes( text: string, document: vscode.TextDocument, documentDir: string, links: vscode.DocumentLink[] ): void`

# Calls

- [createElementNavigationLink](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/createElementNavigationLink.md)
- [resolveReferenceWithFragment](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReferenceWithFragment.md)

# Called by

- [provideDocumentLinks](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/provideDocumentLinks.md)