---
type: TypeScript Method
title: parse
resource: src/properties/propertiesView.ts#L206-L224
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/sharedRegistry/sharedGrammarRegistry
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarOptions/grammarSelectOptions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private parse(document: vscode.TextDocument): Parsed | undefined`

# Calls

- [sharedGrammarRegistry](../../../../../functions/src/preview/sharedRegistry/sharedGrammarRegistry.md)
- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)
- [grammarSelectOptions](../../../../../functions/src/preview/grammarOptions/grammarSelectOptions.md)