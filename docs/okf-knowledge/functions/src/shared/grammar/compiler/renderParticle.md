---
type: TypeScript Function
title: renderParticle
resource: src/shared/grammar/compiler.ts#L260-L282
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/grammar/compiler/contentExpression
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function renderParticle( p: Particle | undefined, isKnown: (n: string) => boolean, nameFor: (n: string) => string, ): string | null`

# Called by

- [contentExpression](../../../../../functions/src/shared/grammar/compiler/contentExpression.md)