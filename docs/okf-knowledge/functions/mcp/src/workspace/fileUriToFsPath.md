---
type: TypeScript Function
title: fileUriToFsPath
resource: mcp/src/workspace.ts#L98-L106
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/mcp/src/tools/ditaExplainKey/handleDitaExplainKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaKeySpace/handleDitaKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/resolveKeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/resolveConkeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaValidate/handleDitaValidate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/fileExists
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fileUriToFsPath(uri: string): string`

# Called by

- [handleDitaExplainKey](../../../../functions/mcp/src/tools/ditaExplainKey/handleDitaExplainKey.md)
- [handleDitaKeySpace](../../../../functions/mcp/src/tools/ditaKeySpace/handleDitaKeySpace.md)
- [resolveKeyref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveKeyref.md)
- [resolveConkeyref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveConkeyref.md)
- [resolveHrefOrConref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref.md)
- [handleDitaValidate](../../../../functions/mcp/src/tools/ditaValidate/handleDitaValidate.md)
- [fileExists](../../../../functions/mcp/src/workspace/fileExists.md)