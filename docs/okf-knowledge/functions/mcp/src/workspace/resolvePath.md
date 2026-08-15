---
type: TypeScript Function
title: resolvePath
resource: mcp/src/workspace.ts#L11-L57
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/test/suite/keySpaceResolver/test/normalize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/validateWithinWorkspace
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/tools/ditaContextSnapshot/handleDitaContextSnapshot
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaExplainKey/handleDitaExplainKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaKeySpace/handleDitaKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaMapStructure/handleDitaMapStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/resolveKeyref
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

`function resolvePath(input: string, workspaceRoot: string): string | null`

# Calls

- [normalize](../../../../functions/src/test/suite/keySpaceResolver/test/normalize.md)
- [validateWithinWorkspace](../../../../functions/mcp/src/workspace/validateWithinWorkspace.md)

# Called by

- [handleDitaContextSnapshot](../../../../functions/mcp/src/tools/ditaContextSnapshot/handleDitaContextSnapshot.md)
- [handleDitaExplainKey](../../../../functions/mcp/src/tools/ditaExplainKey/handleDitaExplainKey.md)
- [handleDitaKeySpace](../../../../functions/mcp/src/tools/ditaKeySpace/handleDitaKeySpace.md)
- [handleDitaMapStructure](../../../../functions/mcp/src/tools/ditaMapStructure/handleDitaMapStructure.md)
- [resolveKeyref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveKeyref.md)
- [resolveHrefOrConref](../../../../functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref.md)
- [handleDitaValidate](../../../../functions/mcp/src/tools/ditaValidate/handleDitaValidate.md)
- [fileExists](../../../../functions/mcp/src/workspace/fileExists.md)