---
type: TypeScript Function
title: resolvePath
resource: mcp/src/workspace.ts#L11-L61
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/validateWithinWorkspace
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolvePath(input: string, workspaceRoot: string): string | null`

# Calls

- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [validateWithinWorkspace](../../../../functions/mcp/src/workspace/validateWithinWorkspace.md)