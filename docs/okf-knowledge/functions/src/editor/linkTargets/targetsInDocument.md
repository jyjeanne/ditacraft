---
type: TypeScript Function
title: targetsInDocument
resource: src/editor/linkTargets.ts#L69-L94
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/linkTargets/titleOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function targetsInDocument(doc: Document, tokensOf: TokensOf): DocTarget[]`

# Calls

- [titleOf](../../../../functions/src/editor/linkTargets/titleOf.md)
- [isElement](../../../../functions/src/shared/cst/types/isElement.md)
- [rootElement](../../../../functions/src/shared/cst/query/rootElement.md)

# Called by

- [pickLinkTarget](../../../../functions/src/editor/linkPicker/pickLinkTarget.md)