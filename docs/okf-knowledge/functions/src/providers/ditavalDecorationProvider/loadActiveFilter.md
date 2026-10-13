---
type: TypeScript Function
title: loadActiveFilter
resource: src/providers/ditavalDecorationProvider.ts#L110-L121
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/buildDitavalFilter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/disposeFlagDecorationTypes
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalDecorationProvider/recompute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function loadActiveFilter(ditavalPath: string): Promise<DitavalFilter>`

# Calls

- [readFile](../../../../functions/webview/editor/readFile.md)
- [buildDitavalFilter](../../../../functions/src/preview/ditaval/buildDitavalFilter.md)
- [disposeFlagDecorationTypes](../../../../functions/src/providers/ditavalDecorationProvider/disposeFlagDecorationTypes.md)

# Called by

- [recompute](../../../../functions/src/providers/ditavalDecorationProvider/recompute.md)