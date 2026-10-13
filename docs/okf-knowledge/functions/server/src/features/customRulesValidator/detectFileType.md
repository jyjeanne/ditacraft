---
type: TypeScript Function
title: detectFileType
resource: server/src/features/customRulesValidator.ts#L193-L203
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/customRulesValidator/validateCustomRules
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function detectFileType(filePath: string, text: string): string`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [validateCustomRules](../../../../../functions/server/src/features/customRulesValidator/validateCustomRules.md)