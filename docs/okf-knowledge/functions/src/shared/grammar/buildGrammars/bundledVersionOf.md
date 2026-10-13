---
type: TypeScript Function
title: bundledVersionOf
resource: src/shared/grammar/buildGrammars.ts#L37-L46
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/grammar/buildGrammars/buildBundledGrammars
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/grammar/test/compileBundled
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function bundledVersionOf(dtdsDir: string, shellPath: string): '1.2' | '1.3' | '2.0'`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [buildBundledGrammars](../../../../../functions/src/shared/grammar/buildGrammars/buildBundledGrammars.md)
- [compileBundled](../../../../../functions/src/test/shared/grammar/test/compileBundled.md)