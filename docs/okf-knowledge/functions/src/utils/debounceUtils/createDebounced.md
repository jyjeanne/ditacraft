---
type: TypeScript Function
title: createDebounced
resource: src/utils/debounceUtils.ts#L157-L195
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaExplorerProvider/DitaExplorerProvider/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function createDebounced<T>( handler: (value: T) => Promise<void> | void, delayMs: number ): Debounced<T>`

# Called by

- [constructor](../../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/constructor.md)
- [constructor](../../../../functions/src/providers/ditaExplorerProvider/DitaExplorerProvider/constructor.md)
- [constructor](../../../../functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/constructor.md)