---
type: TypeScript Function
title: callAndParse
resource: mcp/test/smoke-test.ts#L67-L82
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/test/smoke-test/main
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function callAndParse(name: string, args: Record<string, unknown>): Promise<unknown>`

# Calls

- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [main](../../../../functions/mcp/test/smoke-test/main.md)