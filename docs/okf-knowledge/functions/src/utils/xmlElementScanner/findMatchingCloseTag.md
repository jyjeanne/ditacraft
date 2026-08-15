---
type: TypeScript Function
title: findMatchingCloseTag
resource: src/utils/xmlElementScanner.ts#L76-L96
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/utils/xmlElementScanner/findProfiledElements
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findMatchingCloseTag(content: string, fromIndex: number, tagName: string): number | undefined`

# Called by

- [findProfiledElements](../../../../functions/src/utils/xmlElementScanner/findProfiledElements.md)