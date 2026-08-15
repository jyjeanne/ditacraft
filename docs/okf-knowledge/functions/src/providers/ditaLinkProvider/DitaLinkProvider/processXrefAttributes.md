---
type: TypeScript Method
title: processXrefAttributes
resource: src/providers/ditaLinkProvider.ts#L464-L548
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
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/buildEnhancedTooltip
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/provideDocumentLinks
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private processXrefAttributes( text: string, document: vscode.TextDocument, documentDir: string, links: vscode.DocumentLink[] ): void`

# Calls

- [createElementNavigationLink](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/createElementNavigationLink.md)
- [resolveReferenceWithFragment](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReferenceWithFragment.md)
- [buildEnhancedTooltip](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/buildEnhancedTooltip.md)

# Called by

- [provideDocumentLinks](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/provideDocumentLinks.md)