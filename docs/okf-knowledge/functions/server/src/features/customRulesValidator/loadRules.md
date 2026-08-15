---
type: TypeScript Function
title: loadRules
resource: server/src/features/customRulesValidator.ts#L97-L187
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/customRulesValidator/isSafeRegex
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/customRulesValidator/validateCustomRules
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function loadRules(filePath: string): CompiledRule[]`

# Calls

- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)
- [isSafeRegex](../../../../../functions/server/src/features/customRulesValidator/isSafeRegex.md)

# Called by

- [validateCustomRules](../../../../../functions/server/src/features/customRulesValidator/validateCustomRules.md)