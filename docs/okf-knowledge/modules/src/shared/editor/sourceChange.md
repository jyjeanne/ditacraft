---
type: TypeScript Module
title: sourceChange
resource: src/shared/editor/sourceChange.ts#L1-L365
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
  - target: external/cst-parse
    resolved_by: tree-sitter
    confidence: exact
  - target: external/cst-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/schema
    resolved_by: tree-sitter
    confidence: exact
  - target: external/toprosemirror
    resolved_by: tree-sitter
    confidence: exact
  - target: external/tosource
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [TextEdit](../../../../interfaces/src/shared/editor/sourceChange/TextEdit.md)
- [TextSpan](../../../../interfaces/src/shared/editor/sourceChange/TextSpan.md)
- [applyTextEdits](../../../../functions/src/shared/editor/sourceChange/applyTextEdits.md)
- [editedSpan](../../../../functions/src/shared/editor/sourceChange/editedSpan.md)
- [sourceChange](../../../../functions/src/shared/editor/sourceChange/sourceChange.md)
- [enclosing](../../../../functions/src/shared/editor/sourceChange/enclosing.md)
- [touched](../../../../functions/src/shared/editor/sourceChange/touched.md)
- [keepMarks](../../../../functions/src/shared/editor/sourceChange/keepMarks.md)
- [sourceChangeTransaction](../../../../functions/src/shared/editor/sourceChange/sourceChangeTransaction.md)
- [changedSize](../../../../functions/src/shared/editor/sourceChange/changedSize.md)
- [sameReading](../../../../functions/src/shared/editor/sourceChange/sameReading.md)
- [readingOf](../../../../functions/src/shared/editor/sourceChange/readingOf.md)

# Imports

- `prosemirror-model`
- `prosemirror-state`
- `../cst/parse`
- `../cst/types`
- `./schema`
- `./toProseMirror`
- `./toSource`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)