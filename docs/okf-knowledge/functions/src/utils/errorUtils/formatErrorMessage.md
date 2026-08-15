---
type: TypeScript Function
title: formatErrorMessage
resource: src/utils/errorUtils.ts#L183-L216
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/errorUtils/getErrorMessage
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/errorUtils/formatDitaError
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function formatErrorMessage( error: unknown, context: string, suggestions?: string[] ): string`

# Calls

- [getErrorMessage](../../../../functions/src/utils/errorUtils/getErrorMessage.md)

# Called by

- [formatDitaError](../../../../functions/src/utils/errorUtils/formatDitaError.md)