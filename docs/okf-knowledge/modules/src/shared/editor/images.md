---
type: TypeScript Module
title: images
resource: src/shared/editor/images.ts#L1-L365
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/prosemirror-model
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-state
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
  - target: external/columnwidths
    resolved_by: tree-sitter
    confidence: exact
  - target: external/commands
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

- [ImageSpec](../../../../interfaces/src/shared/editor/images/ImageSpec.md)
- [BlockTarget](../../../../interfaces/src/shared/editor/images/BlockTarget.md)
- [isImagePath](../../../../functions/src/shared/editor/images/isImagePath.md)
- [droppedUris](../../../../functions/src/shared/editor/images/droppedUris.md)
- [ImageCommands](../../../../classes/src/shared/editor/images/ImageCommands.md)
- [constructor](../../../../functions/src/shared/editor/images/ImageCommands/constructor.md)
- [hasAltElement](../../../../functions/src/shared/editor/images/ImageCommands/hasAltElement.md)
- [imageSource](../../../../functions/src/shared/editor/images/ImageCommands/imageSource.md)
- [imageNode](../../../../functions/src/shared/editor/images/ImageCommands/imageNode.md)
- [inlineOk](../../../../functions/src/shared/editor/images/ImageCommands/inlineOk.md)
- [blockTarget](../../../../functions/src/shared/editor/images/ImageCommands/blockTarget.md)
- [breakPlan](../../../../functions/src/shared/editor/images/ImageCommands/breakPlan.md)
- [figure](../../../../functions/src/shared/editor/images/ImageCommands/figure.md)
- [placements](../../../../functions/src/shared/editor/images/ImageCommands/placements.md)
- [insert](../../../../functions/src/shared/editor/images/ImageCommands/insert.md)
- [selectedImage](../../../../functions/src/shared/editor/images/ImageCommands/selectedImage.md)
- [setSize](../../../../functions/src/shared/editor/images/ImageCommands/setSize.md)
- [setHref](../../../../functions/src/shared/editor/images/ImageCommands/setHref.md)
- [setAlt](../../../../functions/src/shared/editor/images/ImageCommands/setAlt.md)
- [ImageSize](../../../../interfaces/src/shared/editor/images/ImageSize.md)
- [resizedImageSize](../../../../functions/src/shared/editor/images/resizedImageSize.md)
- [withAltText](../../../../functions/src/shared/editor/images/withAltText.md)

# Imports

- `prosemirror-model`
- `prosemirror-state`
- `../cst/openTag`
- `../cst/parse`
- `../cst/query`
- `../cst/serialize`
- `../cst/types`
- `./columnWidths`
- `./commands`
- `./schema`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)