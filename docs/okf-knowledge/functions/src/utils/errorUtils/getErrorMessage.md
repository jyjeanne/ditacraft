---
type: TypeScript Function
title: getErrorMessage
resource: src/utils/errorUtils.ts#L17-L67
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/chat/ditacraftParticipant/handleRestructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/chat/ditacraftParticipant/handleValidate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/chat/ditacraftParticipant/handleExplain
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/chat/ditacraftParticipant/handleSuggestReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/configureAICommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/restructureMapCommand/restructureMapCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/aiQuickFixProvider/safeExecuteAiQuickFix
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/isFileNotFoundError
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/formatErrorMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/formatDitaError
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/createEnhancedError
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getErrorMessage(error: unknown, defaultMessage = 'Unknown error'): string`

# Called by

- [handleRestructure](../../../../functions/src/chat/ditacraftParticipant/handleRestructure.md)
- [handleValidate](../../../../functions/src/chat/ditacraftParticipant/handleValidate.md)
- [handleExplain](../../../../functions/src/chat/ditacraftParticipant/handleExplain.md)
- [handleSuggestReuse](../../../../functions/src/chat/ditacraftParticipant/handleSuggestReuse.md)
- [configureAICommand](../../../../functions/src/commands/configureAICommand/configureAICommand.md)
- [restructureMapCommand](../../../../functions/src/commands/restructureMapCommand/restructureMapCommand.md)
- [safeExecuteAiQuickFix](../../../../functions/src/providers/aiQuickFixProvider/safeExecuteAiQuickFix.md)
- [fireAndForget](../../../../functions/src/utils/errorUtils/fireAndForget.md)
- [isFileNotFoundError](../../../../functions/src/utils/errorUtils/isFileNotFoundError.md)
- [formatErrorMessage](../../../../functions/src/utils/errorUtils/formatErrorMessage.md)
- [formatDitaError](../../../../functions/src/utils/errorUtils/formatDitaError.md)
- [createEnhancedError](../../../../functions/src/utils/errorUtils/createEnhancedError.md)