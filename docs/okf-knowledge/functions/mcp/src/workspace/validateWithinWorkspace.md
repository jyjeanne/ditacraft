---
type: TypeScript Function
title: validateWithinWorkspace
resource: mcp/src/workspace.ts#L63-L87
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/test/suite/keySpaceResolver/test/normalize
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

- [normalize](../../../../functions/src/test/suite/keySpaceResolver/test/normalize.md)

# Called by

- [resolveConkeyref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveConkeyref.md)
- [resolveHrefOrConref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref.md)
- [resolvePath](../../../../functions/mcp/src/workspace/resolvePath.md)