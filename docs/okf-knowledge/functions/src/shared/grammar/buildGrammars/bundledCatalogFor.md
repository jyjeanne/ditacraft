---
type: TypeScript Function
title: bundledCatalogFor
resource: src/shared/grammar/buildGrammars.ts#L49-L55
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/grammar/buildGrammars/buildBundledGrammars
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/grammar/test/compileBundled
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function bundledCatalogFor(dtdsDir: string, version: '1.2' | '1.3' | '2.0'): string`

# Called by

- [buildBundledGrammars](../../../../../functions/src/shared/grammar/buildGrammars/buildBundledGrammars.md)
- [compileBundled](../../../../../functions/src/test/shared/grammar/test/compileBundled.md)