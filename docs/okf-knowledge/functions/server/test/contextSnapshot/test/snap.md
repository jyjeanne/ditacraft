---
type: TypeScript Function
title: snap
resource: server/test/contextSnapshot.test.ts#L22-L29
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/contextSnapshot/handleBuildContextSnapshot
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function snap(mapPath: string, maxTokens: number, strategy: BuildContextSnapshotParams['strategy'] = 'breadth-first', focusUri?: string)`

# Calls

- [handleBuildContextSnapshot](../../../../../functions/server/src/features/contextSnapshot/handleBuildContextSnapshot.md)