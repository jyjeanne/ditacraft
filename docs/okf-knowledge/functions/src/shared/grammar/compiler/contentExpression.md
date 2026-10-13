---
type: TypeScript Function
title: contentExpression
resource: src/shared/grammar/compiler.ts#L236-L258
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/pmNames/pmBlockName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/pmNames/pmName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/renderParticle
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/grammar/compiler/compileGrammar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function contentExpression( el: RawElement, mixed: boolean, blockMembers: boolean, isKnown: (n: string) => boolean, placement: Map<string, Placement>, ): string`

# Calls

- [pmBlockName](../../../../../functions/src/shared/grammar/pmNames/pmBlockName.md)
- [pmName](../../../../../functions/src/shared/grammar/pmNames/pmName.md)
- [renderParticle](../../../../../functions/src/shared/grammar/compiler/renderParticle.md)

# Called by

- [compileGrammar](../../../../../functions/src/shared/grammar/compiler/compileGrammar.md)