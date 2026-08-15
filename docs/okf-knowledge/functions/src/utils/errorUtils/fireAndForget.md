---
type: TypeScript Function
title: fireAndForget
resource: src/utils/errorUtils.ts#L98-L125
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/errorUtils/getErrorMessage
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/requestPreviewRefresh
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/executePublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerPreviewAutoRefresh
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/verifyDitaOtInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_handleSetTheme
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_handlePreviewScroll
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_update
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/openLogFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/showLogFileLocation
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fireAndForget( promiseOrThenable: Promise<unknown> | Thenable<unknown>, context?: string, options?: FireAndForgetOptions ): void`

# Calls

- [getErrorMessage](../../../../functions/src/utils/errorUtils/getErrorMessage.md)

# Called by

- [requestPreviewRefresh](../../../../functions/src/commands/previewCommand/requestPreviewRefresh.md)
- [executePublish](../../../../functions/src/commands/publishCommand/executePublish.md)
- [activate](../../../../functions/src/extension/activate.md)
- [registerPreviewAutoRefresh](../../../../functions/src/extension/registerPreviewAutoRefresh.md)
- [verifyDitaOtInstallation](../../../../functions/src/extension/verifyDitaOtInstallation.md)
- [constructor](../../../../functions/src/providers/previewPanel/DitaPreviewPanel/constructor.md)
- [_handleSetTheme](../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handleSetTheme.md)
- [_handlePreviewScroll](../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handlePreviewScroll.md)
- [_update](../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_update.md)
- [openLogFile](../../../../functions/src/utils/logger/Logger/openLogFile.md)
- [showLogFileLocation](../../../../functions/src/utils/logger/Logger/showLogFileLocation.md)