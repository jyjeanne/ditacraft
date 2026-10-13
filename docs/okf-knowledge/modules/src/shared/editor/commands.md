---
type: TypeScript Module
title: commands
resource: src/shared/editor/commands.ts#L1-L872
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/prosemirror-commands
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-model
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-state
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-transform
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

- [DitaCommands](../../../../classes/src/shared/editor/commands/DitaCommands.md)
- [constructor](../../../../functions/src/shared/editor/commands/DitaCommands/constructor.md)
- [role](../../../../functions/src/shared/editor/commands/DitaCommands/role.md)
- [factsOf](../../../../functions/src/shared/editor/commands/DitaCommands/factsOf.md)
- [is](../../../../functions/src/shared/editor/commands/DitaCommands/is.md)
- [isTextrun](../../../../functions/src/shared/editor/commands/DitaCommands/isTextrun.md)
- [paragraph](../../../../functions/src/shared/editor/commands/DitaCommands/paragraph.md)
- [textType](../../../../functions/src/shared/editor/commands/DitaCommands/textType.md)
- [splitIntoParagraph](../../../../functions/src/shared/editor/commands/DitaCommands/splitIntoParagraph.md)
- [insertAfter](../../../../functions/src/shared/editor/commands/DitaCommands/insertAfter.md)
- [leaveList](../../../../functions/src/shared/editor/commands/DitaCommands/leaveList.md)
- [itemAt](../../../../functions/src/shared/editor/commands/DitaCommands/itemAt.md)
- [wrapInList](../../../../functions/src/shared/editor/commands/DitaCommands/wrapInList.md)
- [blockTypesAt](../../../../functions/src/shared/editor/commands/DitaCommands/blockTypesAt.md)
- [allowedIn](../../../../functions/src/shared/editor/commands/DitaCommands/allowedIn.md)
- [setBlockType](../../../../functions/src/shared/editor/commands/DitaCommands/setBlockType.md)
- [insertableAt](../../../../functions/src/shared/editor/commands/DitaCommands/insertableAt.md)
- [insertionPointAt](../../../../functions/src/shared/editor/commands/DitaCommands/insertionPointAt.md)
- [insertionPoint](../../../../functions/src/shared/editor/commands/DitaCommands/insertionPoint.md)
- [fill](../../../../functions/src/shared/editor/commands/DitaCommands/fill.md)
- [preferText](../../../../functions/src/shared/editor/commands/DitaCommands/preferText.md)
- [insertBlock](../../../../functions/src/shared/editor/commands/DitaCommands/insertBlock.md)
- [insertTable](../../../../functions/src/shared/editor/commands/DitaCommands/insertTable.md)
- [inlineContext](../../../../functions/src/shared/editor/commands/DitaCommands/inlineContext.md)
- [inlineInsertableAt](../../../../functions/src/shared/editor/commands/DitaCommands/inlineInsertableAt.md)
- [insertInline](../../../../functions/src/shared/editor/commands/DitaCommands/insertInline.md)
- [elementAt](../../../../functions/src/shared/editor/commands/DitaCommands/elementAt.md)
- [moveElement](../../../../functions/src/shared/editor/commands/DitaCommands/moveElement.md)
- [blockAt](../../../../functions/src/shared/editor/commands/DitaCommands/blockAt.md)
- [normalize](../../../../functions/src/shared/editor/commands/DitaCommands/normalize.md)
- [commonMarks](../../../../functions/src/shared/editor/commands/commonMarks.md)
- [withoutMarks](../../../../functions/src/shared/editor/commands/withoutMarks.md)
- [hasText](../../../../functions/src/shared/editor/commands/hasText.md)
- [offsetOf](../../../../functions/src/shared/editor/commands/offsetOf.md)

# Imports

- `prosemirror-commands`
- `prosemirror-model`
- `prosemirror-state`
- `prosemirror-transform`
- `./schema`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)