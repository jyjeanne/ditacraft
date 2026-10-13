---
type: TypeScript Function
title: baseToken
resource: src/shared/grammar/classTokens.ts#L25-L27
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/classTokens/classTokens
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/grammar/classTokens/basePlacement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/compiler/compileGrammar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function baseToken(classValue: string | undefined): string | undefined`

# Calls

- [classTokens](../../../../../functions/src/shared/grammar/classTokens/classTokens.md)

# Called by

- [basePlacement](../../../../../functions/src/shared/grammar/classTokens/basePlacement.md)
- [compileGrammar](../../../../../functions/src/shared/grammar/compiler/compileGrammar.md)