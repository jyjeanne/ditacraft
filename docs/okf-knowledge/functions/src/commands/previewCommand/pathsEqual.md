---
type: TypeScript Function
title: pathsEqual
resource: src/commands/previewCommand.ts#L195-L203
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/test/suite/keySpaceResolver/test/normalize
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/shouldAutoRefreshPreview
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function pathsEqual(a: string, b: string): boolean`

# Calls

- [normalize](../../../../functions/src/test/suite/keySpaceResolver/test/normalize.md)

# Called by

- [shouldAutoRefreshPreview](../../../../functions/src/commands/previewCommand/shouldAutoRefreshPreview.md)