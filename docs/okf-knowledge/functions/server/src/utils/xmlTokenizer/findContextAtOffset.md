---
type: TypeScript Function
title: findContextAtOffset
resource: server/src/utils/xmlTokenizer.ts#L445-L543
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/formatting/tokenize
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findContextAtOffset( input: string, targetOffset: number ): { context: 'element-name' | 'attribute-name' | 'attribute-value' | 'content' | 'comment' | 'cdata' | 'pi'; elementName: string; attrName: string; prefix: string; }`

# Calls

- [tokenize](../../../../../functions/server/src/features/formatting/tokenize.md)