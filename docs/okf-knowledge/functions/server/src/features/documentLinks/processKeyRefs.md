---
type: TypeScript Function
title: processKeyRefs
resource: server/src/features/documentLinks.ts#L218-L251
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/documentLinks/isInsideComment
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/documentLinks/handleDocumentLinks
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function processKeyRefs( text: string, document: TextDocument, contextFilePath: string, links: DocumentLink[], commentRanges: [number, number][], pattern: RegExp, type: 'keyref' | 'conkeyref' ): void`

# Calls

- [isInsideComment](../../../../../functions/server/src/features/documentLinks/isInsideComment.md)

# Called by

- [handleDocumentLinks](../../../../../functions/server/src/features/documentLinks/handleDocumentLinks.md)