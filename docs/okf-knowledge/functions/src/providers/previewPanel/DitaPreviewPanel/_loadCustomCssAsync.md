---
type: TypeScript Method
title: _loadCustomCssAsync
resource: src/providers/previewPanel.ts#L703-L746
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/suite/keySpaceResolver/test/normalize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_sanitizeCss
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_injectPreviewEnhancementsAsync
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _loadCustomCssAsync(): Promise<string>`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [normalize](../../../../../functions/src/test/suite/keySpaceResolver/test/normalize.md)
- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)
- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)
- [_sanitizeCss](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_sanitizeCss.md)

# Called by

- [_injectPreviewEnhancementsAsync](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_injectPreviewEnhancementsAsync.md)