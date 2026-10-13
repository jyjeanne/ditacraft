---
type: TypeScript Method
title: parseProgress
resource: src/utils/ditaOtWrapper.ts#L715-L737
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private parseProgress(output: string): PublishProgress | null`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [publish](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)