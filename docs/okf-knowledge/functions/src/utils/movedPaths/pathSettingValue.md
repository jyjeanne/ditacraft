---
type: TypeScript Function
title: pathSettingValue
resource: src/utils/movedPaths.ts#L61-L69
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/pathSettings/followPathSettings
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function pathSettingValue(original: string, newPath: string, workspaceFolder: string | undefined): string`

# Calls

- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [followPathSettings](../../../../functions/src/utils/pathSettings/followPathSettings.md)