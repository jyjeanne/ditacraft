---
type: TypeScript Function
title: buildLevel3
resource: server/src/features/contextSnapshot.ts#L138-L196
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/contextSnapshot/collectRefs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/contextSnapshot/handleBuildContextSnapshot
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildLevel3(graph: ContextGraph, maxTokens: number, focusUri?: string): string`

# Calls

- [collectRefs](../../../../../functions/server/src/features/contextSnapshot/collectRefs.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [handleBuildContextSnapshot](../../../../../functions/server/src/features/contextSnapshot/handleBuildContextSnapshot.md)