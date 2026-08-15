---
type: TypeScript Method
title: processKeyrefAttributesWithKeySpace
resource: src/providers/ditaLinkProvider.ts#L372-L458
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReference
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

- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)
- [resolveReference](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReference.md)

# Called by

- [provideDocumentLinks](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/provideDocumentLinks.md)