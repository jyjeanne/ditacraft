---
type: TypeScript Function
title: fileExists
resource: mcp/src/workspace.ts#L107-L118
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/mcp/src/workspace/resolvePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/fileUriToFsPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/tools/ditaValidate/handleDitaValidate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fileExists(fileUri: string, workspaceRoot: string): boolean`

# Calls

- [resolvePath](../../../../functions/mcp/src/workspace/resolvePath.md)
- [fileUriToFsPath](../../../../functions/mcp/src/workspace/fileUriToFsPath.md)

# Called by

- [handleDitaValidate](../../../../functions/mcp/src/tools/ditaValidate/handleDitaValidate.md)