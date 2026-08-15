---
type: TypeScript Function
title: isWithinSpans
resource: src/utils/xmlElementScanner.ts#L65-L67
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/utils/xmlElementScanner/findProfiledElements
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isWithinSpans(offset: number, spans: ReadonlyArray<[number, number]>): boolean`

# Called by

- [findProfiledElements](../../../../functions/src/utils/xmlElementScanner/findProfiledElements.md)