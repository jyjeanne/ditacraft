---
type: TypeScript Module
title: toSource
resource: src/shared/editor/toSource.ts#L1-L784
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/prosemirror-model
    resolved_by: tree-sitter
    confidence: exact
  - target: external/cst-opentag
    resolved_by: tree-sitter
    confidence: exact
  - target: external/cst-parse
    resolved_by: tree-sitter
    confidence: exact
  - target: external/cst-query
    resolved_by: tree-sitter
    confidence: exact
  - target: external/cst-serialize
    resolved_by: tree-sitter
    confidence: exact
  - target: external/cst-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/render-html
    resolved_by: tree-sitter
    confidence: exact
  - target: external/schema
    resolved_by: tree-sitter
    confidence: exact
  - target: external/toprosemirror
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [sameXml](../../../../functions/src/shared/editor/toSource/sameXml.md)
- [cdataText](../../../../functions/src/shared/editor/toSource/cdataText.md)
- [projectText](../../../../functions/src/shared/editor/toSource/projectText.md)
- [rawWithAttributes](../../../../functions/src/shared/editor/toSource/rawWithAttributes.md)
- [serializeDocument](../../../../functions/src/shared/editor/toSource/serializeDocument.md)
- [Writer](../../../../classes/src/shared/editor/toSource/Writer.md)
- [constructor](../../../../functions/src/shared/editor/toSource/Writer/constructor.md)
- [raw](../../../../functions/src/shared/editor/toSource/Writer/raw.md)
- [origin](../../../../functions/src/shared/editor/toSource/Writer/origin.md)
- [role](../../../../functions/src/shared/editor/toSource/Writer/role.md)
- [lineIndent](../../../../functions/src/shared/editor/toSource/Writer/lineIndent.md)
- [node](../../../../functions/src/shared/editor/toSource/Writer/node.md)
- [newText](../../../../functions/src/shared/editor/toSource/Writer/newText.md)
- [childrenOf](../../../../functions/src/shared/editor/toSource/Writer/childrenOf.md)
- [openTag](../../../../functions/src/shared/editor/toSource/Writer/openTag.md)
- [changedElement](../../../../functions/src/shared/editor/toSource/Writer/changedElement.md)
- [newElement](../../../../functions/src/shared/editor/toSource/Writer/newElement.md)
- [blockList](../../../../functions/src/shared/editor/toSource/Writer/blockList.md)
- [placed](../../../../functions/src/shared/editor/toSource/Writer/placed.md)
- [outerStart](../../../../functions/src/shared/editor/toSource/Writer/outerStart.md)
- [outerEnd](../../../../functions/src/shared/editor/toSource/Writer/outerEnd.md)
- [shareMark](../../../../functions/src/shared/editor/toSource/Writer/shareMark.md)
- [children](../../../../functions/src/shared/editor/toSource/Writer/children.md)
- [inlineMiddle](../../../../functions/src/shared/editor/toSource/Writer/inlineMiddle.md)
- [characterEdit](../../../../functions/src/shared/editor/toSource/Writer/characterEdit.md)
- [Unit](../../../../interfaces/src/shared/editor/toSource/Unit.md)
- [markOnlySources](../../../../functions/src/shared/editor/toSource/Writer/markOnlySources.md)
- [separator](../../../../functions/src/shared/editor/toSource/Writer/separator.md)
- [blockMiddle](../../../../functions/src/shared/editor/toSource/Writer/blockMiddle.md)
- [markDepth](../../../../functions/src/shared/editor/toSource/Writer/markDepth.md)
- [orderedMarks](../../../../functions/src/shared/editor/toSource/Writer/orderedMarks.md)
- [markTags](../../../../functions/src/shared/editor/toSource/Writer/markTags.md)
- [inline](../../../../functions/src/shared/editor/toSource/Writer/inline.md)

# Imports

- `prosemirror-model`
- `../cst/openTag`
- `../cst/parse`
- `../cst/query`
- `../cst/serialize`
- `../cst/types`
- `../render/html`
- `./schema`
- `./toProseMirror`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)