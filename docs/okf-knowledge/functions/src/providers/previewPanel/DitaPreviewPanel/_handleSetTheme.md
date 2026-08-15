---
type: TypeScript Method
title: _handleSetTheme
resource: src/providers/previewPanel.ts#L211-L228
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private _handleSetTheme(theme: string): void`

# Calls

- [fireAndForget](../../../../../functions/src/utils/errorUtils/fireAndForget.md)
- [getConfiguration](../../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [constructor](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/constructor.md)