---
type: TypeScript Function
title: isErrorLine
resource: src/utils/ditaOtErrorParser.ts#L214-L245
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/utils/ditaOtErrorParser/parseDitaOtOutput
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorParser/parseErrorLine
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isErrorLine(line: string): boolean`

# Called by

- [parseDitaOtOutput](../../../../functions/src/utils/ditaOtErrorParser/parseDitaOtOutput.md)
- [parseErrorLine](../../../../functions/src/utils/ditaOtErrorParser/parseErrorLine.md)