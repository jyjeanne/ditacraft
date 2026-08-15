---
type: TypeScript Function
title: getSimpleTextContent
resource: server/src/features/formatting.ts#L298-L321
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/formatting/formatXML
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getSimpleTextContent( tokens: XMLToken[], startIdx: number, tagName: string ): { text: string; endIdx: number } | null`

# Called by

- [formatXML](../../../../../functions/server/src/features/formatting/formatXML.md)