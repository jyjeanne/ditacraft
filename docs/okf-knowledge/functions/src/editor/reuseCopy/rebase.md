---
type: TypeScript Function
title: rebase
resource: src/editor/reuseCopy.ts#L166-L195
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/uriPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/paths/samePath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/inlineConref/rebaseContentReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/reuseCopy
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rebase(value: string, from: string, to: string, sameFile: boolean, sourceTopicId: string | undefined): string`

# Calls

- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [uriPath](../../../../functions/src/editor/reuseCopy/uriPath.md)
- [samePath](../../../../functions/src/preview/paths/samePath.md)

# Called by

- [rebaseContentReferences](../../../../functions/server/src/features/inlineConref/rebaseContentReferences.md)
- [reuseCopy](../../../../functions/src/editor/reuseCopy/reuseCopy.md)