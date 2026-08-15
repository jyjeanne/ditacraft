---
type: TypeScript Function
title: handleDitaValidate
resource: mcp/src/tools/ditaValidate.ts#L37-L129
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/fragmentValidator/handleValidateFragment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/resolvePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/fileExists
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/mcpSettings/defaultMcpSettings
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaValidate/diagnosticSeverity
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleDitaValidate( args: unknown, ctx: McpContext, ): Promise<DitaValidateResult | { error: string }>`

# Calls

- [handleValidateFragment](../../../../../functions/server/src/features/fragmentValidator/handleValidateFragment.md)
- [resolvePath](../../../../../functions/mcp/src/workspace/resolvePath.md)
- [fileExists](../../../../../functions/mcp/src/workspace/fileExists.md)
- [defaultMcpSettings](../../../../../functions/mcp/src/mcpSettings/defaultMcpSettings.md)
- [diagnosticSeverity](../../../../../functions/mcp/src/tools/ditaValidate/diagnosticSeverity.md)