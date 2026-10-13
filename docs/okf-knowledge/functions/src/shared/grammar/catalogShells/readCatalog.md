---
type: TypeScript Function
title: readCatalog
resource: src/shared/grammar/catalogShells.ts#L25-L27
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/grammar/catalogShells/catalogChain
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/catalogShells/discoverShells
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function readCatalog(file: string): string`

# Called by

- [catalogChain](../../../../../functions/src/shared/grammar/catalogShells/catalogChain.md)
- [discoverShells](../../../../../functions/src/shared/grammar/catalogShells/discoverShells.md)