---
type: TypeScript Function
title: parseSuppressions
resource: server/src/services/suppressionEngine.ts#L53-L119
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/suppressionEngine/offsetToLine
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/suppressionEngine/applySuppressions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function parseSuppressions(text: string): SuppressionState`

# Calls

- [offsetToLine](../../../../../functions/server/src/services/suppressionEngine/offsetToLine.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [applySuppressions](../../../../../functions/server/src/services/suppressionEngine/applySuppressions.md)