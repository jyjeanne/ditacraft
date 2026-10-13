---
type: TypeScript Module
title: schema
resource: src/shared/editor/schema.ts#L1-L613
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/prosemirror-model
    resolved_by: tree-sitter
    confidence: exact
  - target: external/grammar-classtokens
    resolved_by: tree-sitter
    confidence: exact
  - target: external/grammar-pmnames
    resolved_by: tree-sitter
    confidence: exact
  - target: external/grammar-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/render-html
    resolved_by: tree-sitter
    confidence: exact
  - target: external/columnwidths
    resolved_by: tree-sitter
    confidence: exact
  - target: external/render-labels
    resolved_by: tree-sitter
    confidence: exact
  - target: external/maps
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [TypeRole](../../../../interfaces/src/shared/editor/schema/TypeRole.md)
- [ElementFacts](../../../../interfaces/src/shared/editor/schema/ElementFacts.md)
- [EditorSchema](../../../../interfaces/src/shared/editor/schema/EditorSchema.md)
- [kindOf](../../../../functions/src/shared/editor/schema/kindOf.md)
- [groupExpression](../../../../functions/src/shared/editor/schema/groupExpression.md)
- [buildEditorSchema](../../../../functions/src/shared/editor/schema/buildEditorSchema.md)
- [childSetOf](../../../../functions/src/shared/editor/schema/childSetOf.md)
- [Presentation](../../../../interfaces/src/shared/editor/schema/Presentation.md)
- [presentationOf](../../../../functions/src/shared/editor/schema/presentationOf.md)
- [xmlAttr](../../../../functions/src/shared/editor/schema/xmlAttr.md)
- [baseAttrs](../../../../functions/src/shared/editor/schema/baseAttrs.md)
- [elementDom](../../../../functions/src/shared/editor/schema/elementDom.md)
- [markDom](../../../../functions/src/shared/editor/schema/markDom.md)
- [viewText](../../../../functions/src/shared/editor/schema/viewText.md)
- [opaqueDom](../../../../functions/src/shared/editor/schema/opaqueDom.md)
- [unknownDom](../../../../functions/src/shared/editor/schema/unknownDom.md)

# Imports

- `prosemirror-model`
- `../grammar/classTokens`
- `../grammar/pmNames`
- `../grammar/types`
- `../render/html`
- `./columnWidths`
- `../render/labels`
- `./maps`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)