---
type: TypeScript Module
title: toProseMirror
resource: src/shared/editor/toProseMirror.ts#L1-L648
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/prosemirror-model
    resolved_by: tree-sitter
    confidence: exact
  - target: external/cst-elementindex
    resolved_by: tree-sitter
    confidence: exact
  - target: external/cst-parse
    resolved_by: tree-sitter
    confidence: exact
  - target: external/cst-query
    resolved_by: tree-sitter
    confidence: exact
  - target: external/cst-tablegrid
    resolved_by: tree-sitter
    confidence: exact
  - target: external/cst-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/render-html
    resolved_by: tree-sitter
    confidence: exact
  - target: external/columnwidths
    resolved_by: tree-sitter
    confidence: exact
  - target: external/schema
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [TextOrigin](../../../../interfaces/src/shared/editor/toProseMirror/TextOrigin.md)
- [NodeOrigin](../../../../interfaces/src/shared/editor/toProseMirror/NodeOrigin.md)
- [Base](../../../../interfaces/src/shared/editor/toProseMirror/Base.md)
- [BuildResult](../../../../interfaces/src/shared/editor/toProseMirror/BuildResult.md)
- [codePoint](../../../../functions/src/shared/editor/toProseMirror/codePoint.md)
- [decodeText](../../../../functions/src/shared/editor/toProseMirror/decodeText.md)
- [detectIndentUnit](../../../../functions/src/shared/editor/toProseMirror/detectIndentUnit.md)
- [summary](../../../../functions/src/shared/editor/toProseMirror/summary.md)
- [InlineState](../../../../interfaces/src/shared/editor/toProseMirror/InlineState.md)
- [Builder](../../../../classes/src/shared/editor/toProseMirror/Builder.md)
- [constructor](../../../../functions/src/shared/editor/toProseMirror/Builder/constructor.md)
- [schema](../../../../functions/src/shared/editor/toProseMirror/Builder/schema.md)
- [xmlAttrs](../../../../functions/src/shared/editor/toProseMirror/Builder/xmlAttrs.md)
- [elementOrigin](../../../../functions/src/shared/editor/toProseMirror/Builder/elementOrigin.md)
- [register](../../../../functions/src/shared/editor/toProseMirror/Builder/register.md)
- [attrsFor](../../../../functions/src/shared/editor/toProseMirror/Builder/attrsFor.md)
- [isReference](../../../../functions/src/shared/editor/toProseMirror/Builder/isReference.md)
- [opaqueView](../../../../functions/src/shared/editor/toProseMirror/Builder/opaqueView.md)
- [opaque](../../../../functions/src/shared/editor/toProseMirror/Builder/opaque.md)
- [block](../../../../functions/src/shared/editor/toProseMirror/Builder/block.md)
- [fragment](../../../../functions/src/shared/editor/toProseMirror/Builder/fragment.md)
- [needsBlock](../../../../functions/src/shared/editor/toProseMirror/Builder/needsBlock.md)
- [blockContent](../../../../functions/src/shared/editor/toProseMirror/Builder/blockContent.md)
- [inlineContent](../../../../functions/src/shared/editor/toProseMirror/Builder/inlineContent.md)
- [trimEdges](../../../../functions/src/shared/editor/toProseMirror/Builder/trimEdges.md)
- [inline](../../../../functions/src/shared/editor/toProseMirror/Builder/inline.md)
- [text](../../../../functions/src/shared/editor/toProseMirror/Builder/text.md)
- [inlineElement](../../../../functions/src/shared/editor/toProseMirror/Builder/inlineElement.md)
- [withMarks](../../../../functions/src/shared/editor/toProseMirror/Builder/withMarks.md)
- [prepareTable](../../../../functions/src/shared/editor/toProseMirror/Builder/prepareTable.md)
- [viewFor](../../../../functions/src/shared/editor/toProseMirror/Builder/viewFor.md)
- [buildFragment](../../../../functions/src/shared/editor/toProseMirror/buildFragment.md)
- [detachNode](../../../../functions/src/shared/editor/toProseMirror/detachNode.md)
- [buildDocument](../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)

# Imports

- `prosemirror-model`
- `../cst/elementIndex`
- `../cst/parse`
- `../cst/query`
- `../cst/tableGrid`
- `../cst/types`
- `../render/html`
- `./columnWidths`
- `./schema`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)