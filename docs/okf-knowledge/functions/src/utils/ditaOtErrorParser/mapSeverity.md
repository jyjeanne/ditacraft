---
type: TypeScript Function
title: mapSeverity
resource: src/utils/ditaOtErrorParser.ts#L128-L140
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/utils/ditaOtErrorParser/parseErrorLine
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function mapSeverity(severity: string | undefined): 'error' | 'warning' | 'info'`

# Called by

- [parseErrorLine](../../../../functions/src/utils/ditaOtErrorParser/parseErrorLine.md)