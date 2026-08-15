---
type: TypeScript Function
title: findAttributeAtOffset
resource: server/src/utils/xmlTokenizer.ts#L393-L439
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/formatting/tokenize
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findAttributeAtOffset( input: string, targetOffset: number ): { elementName: string; attrName: string; attrValue: string; valueStart: number; valueEnd: number; } | null`

# Calls

- [tokenize](../../../../../functions/server/src/features/formatting/tokenize.md)