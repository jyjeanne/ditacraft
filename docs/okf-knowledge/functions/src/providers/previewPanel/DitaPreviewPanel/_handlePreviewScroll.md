---
type: TypeScript Method
title: _handlePreviewScroll
resource: src/providers/previewPanel.ts#L395-L478
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private _handlePreviewScroll(scrollPercentage: number): void`

# Calls

- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)
- [fireAndForget](../../../../../functions/src/utils/errorUtils/fireAndForget.md)

# Called by

- [constructor](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/constructor.md)