---
type: TypeScript Method
title: contextExclusion
resource: src/preview/visualPreviewPanel.ts#L381-L392
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/postInfoBanner
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private contextExclusion(): string | undefined`

# Calls

- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [format](../../../../../functions/src/shared/render/labels/format.md)

# Called by

- [postInfoBanner](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/postInfoBanner.md)