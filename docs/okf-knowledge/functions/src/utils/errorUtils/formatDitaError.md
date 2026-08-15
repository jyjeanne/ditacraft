---
type: TypeScript Function
title: formatDitaError
resource: src/utils/errorUtils.ts#L226-L279
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/errorUtils/getErrorMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/formatErrorMessage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function formatDitaError( error: unknown, errorType: 'validation' | 'publishing' | 'preview' | 'general' ): string`

# Calls

- [getErrorMessage](../../../../functions/src/utils/errorUtils/getErrorMessage.md)
- [formatErrorMessage](../../../../functions/src/utils/errorUtils/formatErrorMessage.md)