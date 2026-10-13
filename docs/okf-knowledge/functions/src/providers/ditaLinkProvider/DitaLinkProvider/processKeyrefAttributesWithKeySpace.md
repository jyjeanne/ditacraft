---
type: TypeScript Method
title: processKeyrefAttributesWithKeySpace
resource: src/providers/ditaLinkProvider.ts#L372-L458
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

`private async processKeyrefAttributesWithKeySpace( text: string, document: vscode.TextDocument, documentDir: string, links: vscode.DocumentLink[] ): Promise<void>`

# Calls

- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [provideDocumentLinks](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/provideDocumentLinks.md)