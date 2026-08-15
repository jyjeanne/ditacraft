---
type: TypeScript Function
title: loadActiveRules
resource: src/providers/ditavalDecorationProvider.ts#L52-L61
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditavalParser/parseDitavalRules
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalDecorationProvider/recompute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function loadActiveRules(ditavalPath: string): Promise<DitavalRule[]>`

# Calls

- [parseDitavalRules](../../../../functions/src/utils/ditavalParser/parseDitavalRules.md)

# Called by

- [recompute](../../../../functions/src/providers/ditavalDecorationProvider/recompute.md)