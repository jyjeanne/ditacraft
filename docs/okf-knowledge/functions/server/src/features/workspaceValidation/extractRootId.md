---
type: TypeScript Function
title: extractRootId
resource: server/src/features/workspaceValidation.ts#L23-L41
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/WorkspaceIndex/indexFile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function extractRootId(text: string): { tagName: string; id: string; index: number } | null`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [detectCrossFileDuplicateIds](../../../../../functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds.md)
- [indexFile](../../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/indexFile.md)