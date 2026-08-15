---
type: TypeScript Function
title: buildLevel2
resource: server/src/features/contextSnapshot.ts#L126-L129
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/contextSnapshot/renderMapNodeText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/contextSnapshot/handleBuildContextSnapshot
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildLevel2(graph: ContextGraph): string`

# Calls

- [renderMapNodeText](../../../../../functions/server/src/features/contextSnapshot/renderMapNodeText.md)

# Called by

- [handleBuildContextSnapshot](../../../../../functions/server/src/features/contextSnapshot/handleBuildContextSnapshot.md)