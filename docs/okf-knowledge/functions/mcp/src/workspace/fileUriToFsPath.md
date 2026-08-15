---
type: TypeScript Function
title: fileUriToFsPath
resource: mcp/src/workspace.ts#L94-L102
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/mcp/src/tools/ditaResolveReference/resolveKeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/resolveConkeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/fileExists
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fileUriToFsPath(uri: string): string`

# Called by

- [resolveKeyref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveKeyref.md)
- [resolveConkeyref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveConkeyref.md)
- [resolveHrefOrConref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref.md)
- [fileExists](../../../../functions/mcp/src/workspace/fileExists.md)