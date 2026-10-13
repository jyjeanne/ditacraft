---
type: TypeScript Module
title: links
resource: src/shared/editor/links.ts#L1-L149
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
  - target: external/cst-serialize
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

- [LinkTarget](../../../../interfaces/src/shared/editor/links/LinkTarget.md)
- [linkAttributes](../../../../functions/src/shared/editor/links/linkAttributes.md)
- [LinkCommands](../../../../classes/src/shared/editor/links/LinkCommands.md)
- [constructor](../../../../functions/src/shared/editor/links/LinkCommands/constructor.md)
- [isLink](../../../../functions/src/shared/editor/links/LinkCommands/isLink.md)
- [linkAt](../../../../functions/src/shared/editor/links/LinkCommands/linkAt.md)
- [current](../../../../functions/src/shared/editor/links/LinkCommands/current.md)
- [canInsert](../../../../functions/src/shared/editor/links/LinkCommands/canInsert.md)
- [setLink](../../../../functions/src/shared/editor/links/LinkCommands/setLink.md)

# Imports

- `prosemirror-model`
- `prosemirror-state`
- `../cst/openTag`
- `../cst/serialize`
- `./commands`
- `./schema`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)