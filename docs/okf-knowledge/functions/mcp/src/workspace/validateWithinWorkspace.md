---
type: TypeScript Function
title: validateWithinWorkspace
resource: mcp/src/workspace.ts#L67-L91
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/tools/ditaResolveReference/resolveConkeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/resolvePath
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateWithinWorkspace(filePath: string, workspaceRoot: string): boolean`

# Calls

- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [resolveConkeyref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveConkeyref.md)
- [resolveHrefOrConref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref.md)
- [resolvePath](../../../../functions/mcp/src/workspace/resolvePath.md)