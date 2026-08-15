---
type: TypeScript Function
title: findProfiledElements
resource: src/utils/xmlElementScanner.ts#L102-L137
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/xmlElementScanner/findCommentSpans
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/xmlElementScanner/isWithinSpans
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/xmlElementScanner/parseTagAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/xmlElementScanner/findMatchingCloseTag
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalDecorationProvider/recompute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findProfiledElements(content: string, profilingAttrs: readonly string[]): ProfiledElement[]`

# Calls

- [findCommentSpans](../../../../functions/src/utils/xmlElementScanner/findCommentSpans.md)
- [isWithinSpans](../../../../functions/src/utils/xmlElementScanner/isWithinSpans.md)
- [parseTagAttributes](../../../../functions/src/utils/xmlElementScanner/parseTagAttributes.md)
- [findMatchingCloseTag](../../../../functions/src/utils/xmlElementScanner/findMatchingCloseTag.md)

# Called by

- [recompute](../../../../functions/src/providers/ditavalDecorationProvider/recompute.md)