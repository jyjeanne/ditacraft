---
type: TypeScript Function
title: processFileRefs
resource: server/src/features/documentLinks.ts#L165-L212
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/documentLinks/shouldSkip
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/documentLinks/isInsideComment
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/documentLinks/handleDocumentLinks
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function processFileRefs( text: string, document: TextDocument, documentDir: string, links: DocumentLink[], commentRanges: [number, number][], pattern: RegExp, workspaceFolders: readonly string[] ): void`

# Calls

- [shouldSkip](../../../../../functions/server/src/features/documentLinks/shouldSkip.md)
- [isInsideComment](../../../../../functions/server/src/features/documentLinks/isInsideComment.md)

# Called by

- [handleDocumentLinks](../../../../../functions/server/src/features/documentLinks/handleDocumentLinks.md)