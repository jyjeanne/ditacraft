---
type: TypeScript Function
title: canonicalizeCycle
resource: server/src/features/circularRefDetection.ts#L233-L243
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/src/features/circularRefDetection/detectCircularReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function canonicalizeCycle(cyclePath: string[]): string`

# Called by

- [detectCircularReferences](../../../../../functions/server/src/features/circularRefDetection/detectCircularReferences.md)