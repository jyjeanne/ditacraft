---
type: TypeScript Function
title: buildLevel1
resource: server/src/features/contextSnapshot.ts#L92-L95
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/contextSnapshot/renderMapNodeXml
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/contextSnapshot/handleBuildContextSnapshot
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildLevel1(graph: ContextGraph): string`

# Calls

- [renderMapNodeXml](../../../../../functions/server/src/features/contextSnapshot/renderMapNodeXml.md)

# Called by

- [handleBuildContextSnapshot](../../../../../functions/server/src/features/contextSnapshot/handleBuildContextSnapshot.md)