---
type: TypeScript Function
title: parseErrorLine
resource: src/utils/ditaOtErrorParser.ts#L250-L306
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtErrorParser/mapSeverity
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorParser/isErrorLine
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/ditaOtErrorParser/parseDitaOtOutput
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function parseErrorLine(line: string, baseDir?: string): DitaOtError | null`

# Calls

- [mapSeverity](../../../../functions/src/utils/ditaOtErrorParser/mapSeverity.md)
- [isErrorLine](../../../../functions/src/utils/ditaOtErrorParser/isErrorLine.md)

# Called by

- [parseDitaOtOutput](../../../../functions/src/utils/ditaOtErrorParser/parseDitaOtOutput.md)