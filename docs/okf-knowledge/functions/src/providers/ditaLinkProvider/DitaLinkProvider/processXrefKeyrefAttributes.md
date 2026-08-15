---
type: TypeScript Method
title: processXrefKeyrefAttributes
resource: src/providers/ditaLinkProvider.ts#L554-L615
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
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

- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [provideDocumentLinks](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/provideDocumentLinks.md)