---
type: TypeScript Method
title: validateWithGrammar
resource: server/src/services/rngValidationService.ts#L265-L357
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/end
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/rngValidationService/RngValidationService/validate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private validateWithGrammar(text: string, grammar: SalveGrammar): Diagnostic[]`

# Calls

- [entries](../../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [end](../../../../../../functions/webview/editor/mapView/RowDrag/end.md)

# Called by

- [validate](../../../../../../functions/server/src/services/rngValidationService/RngValidationService/validate.md)