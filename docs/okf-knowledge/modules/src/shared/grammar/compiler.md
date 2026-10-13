---
type: TypeScript Module
title: compiler
resource: src/shared/grammar/compiler.ts#L1-L383
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/classtokens
    resolved_by: tree-sitter
    confidence: exact
  - target: external/pmnames
    resolved_by: tree-sitter
    confidence: exact
  - target: external/types
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [CompileMeta](../../../../interfaces/src/shared/grammar/compiler/CompileMeta.md)
- [compileGrammar](../../../../functions/src/shared/grammar/compiler/compileGrammar.md)
- [isForeignByUse](../../../../functions/src/shared/grammar/compiler/isForeignByUse.md)
- [memberNames](../../../../functions/src/shared/grammar/compiler/memberNames.md)
- [contentExpression](../../../../functions/src/shared/grammar/compiler/contentExpression.md)
- [renderParticle](../../../../functions/src/shared/grammar/compiler/renderParticle.md)
- [expandEntities](../../../../functions/src/shared/grammar/compiler/expandEntities.md)
- [expandText](../../../../functions/src/shared/grammar/compiler/expandText.md)
- [safeFromCodePoint](../../../../functions/src/shared/grammar/compiler/safeFromCodePoint.md)
- [expandAttrDefaults](../../../../functions/src/shared/grammar/compiler/expandAttrDefaults.md)

# Imports

- `./classTokens`
- `./pmNames`
- `./types`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)