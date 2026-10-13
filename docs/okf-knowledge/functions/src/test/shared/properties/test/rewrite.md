---
type: TypeScript Function
title: rewrite
resource: src/test/shared/properties.test.ts#L24-L29
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/mapContexts/MapContexts/pick
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/openTag/rewriteOpenTag
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/buildEditsForVerifiedRefs
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rewrite(source: string, pick: (doc: ReturnType<typeof parse>) => ElementNode, change: (xml: AttributePairs) => AttributePairs, rename?: string): string`

# Calls

- [pick](../../../../../../functions/src/preview/mapContexts/MapContexts/pick.md)
- [rewriteOpenTag](../../../../../../functions/src/shared/cst/openTag/rewriteOpenTag.md)

# Called by

- [buildEditsForVerifiedRefs](../../../../../../functions/server/src/features/rename/buildEditsForVerifiedRefs.md)