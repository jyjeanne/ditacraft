---
type: TypeScript Function
title: resolvedTargets
resource: src/shared/editor/reused.ts#L54-L70
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/reused/isReuseNode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/showResolved
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolvedTargets(doc: PMNode, fresh: BuildResult, items: readonly ResolvedItem[], es: EditorSchema): { pos: number; item: ResolvedItem }[]`

# Calls

- [nodeAt](../../../../../functions/src/test/shared/editor/test/nodeAt.md)
- [isMapRow](../../../../../functions/src/shared/editor/maps/isMapRow.md)
- [isReuseNode](../../../../../functions/src/shared/editor/reused/isReuseNode.md)

# Called by

- [showResolved](../../../../../functions/webview/editor/showResolved.md)