---
type: TypeScript Method
title: _injectPreviewEnhancementsAsync
resource: src/providers/previewPanel.ts#L752-L990
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_getHtmlForWebviewAsync
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _injectPreviewEnhancementsAsync(html: string): Promise<string>`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [_loadCustomCssAsync](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync.md)
- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)

# Called by

- [_getHtmlForWebviewAsync](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_getHtmlForWebviewAsync.md)