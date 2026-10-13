---
type: TypeScript Function
title: memberNames
resource: src/shared/grammar/compiler.ts#L222-L234
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/grammar/compiler/compileGrammar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/isForeignByUse
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function memberNames(model: Particle | undefined, out = new Set<string>()): Set<string>`

# Called by

- [compileGrammar](../../../../../functions/src/shared/grammar/compiler/compileGrammar.md)
- [isForeignByUse](../../../../../functions/src/shared/grammar/compiler/isForeignByUse.md)