---
type: TypeScript Function
title: rows
resource: src/test/suite/configureAI.test.ts#L28-L32
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/configureAICommand/describeProviders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rows(config: Partial<DitaCraftLLMConfig>, available: Record<string, boolean>, keys: { anthropic?: 'stored' | 'env'; openai?: 'stored' | 'env' } = {})`

# Calls

- [describeProviders](../../../../../../functions/src/commands/configureAICommand/describeProviders.md)
- [entries](../../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)