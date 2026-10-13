---
type: TypeScript Function
title: flagHover
resource: src/providers/ditavalDecorationProvider.ts#L92-L95
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalDecorationProvider/recompute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function flagHover(filterLabel: string, span: MarkSpan): vscode.MarkdownString`

# Calls

- [entries](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [recompute](../../../../functions/src/providers/ditavalDecorationProvider/recompute.md)