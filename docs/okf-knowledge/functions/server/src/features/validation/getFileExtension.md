---
type: TypeScript Function
title: getFileExtension
resource: server/src/features/validation.ts#L753-L757
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/validation/validateDITAStructure
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getFileExtension(uri: string): string`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)

# Called by

- [validateDITAStructure](../../../../../functions/server/src/features/validation/validateDITAStructure.md)