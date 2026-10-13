---
type: TypeScript Function
title: catalogChain
resource: src/shared/grammar/catalogShells.ts#L40-L64
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/catalogShells/readCatalog
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/catalogShells/attributes
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/grammar/catalogShells/discoverShells
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/grammarCache/compileWithCache
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function catalogChain(catalogPath: string): string[]`

# Calls

- [readCatalog](../../../../../functions/src/shared/grammar/catalogShells/readCatalog.md)
- [attributes](../../../../../functions/src/shared/grammar/catalogShells/attributes.md)

# Called by

- [discoverShells](../../../../../functions/src/shared/grammar/catalogShells/discoverShells.md)
- [compileWithCache](../../../../../functions/src/shared/grammar/grammarCache/compileWithCache.md)