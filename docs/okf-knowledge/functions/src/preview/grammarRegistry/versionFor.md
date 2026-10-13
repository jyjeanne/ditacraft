---
type: TypeScript Function
title: versionFor
resource: src/preview/grammarRegistry.ts#L221-L234
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/byPublicId
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function versionFor(publicId: string | undefined, setting: string | undefined, archVersion: string | undefined): string`

# Called by

- [select](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)
- [byPublicId](../../../../functions/src/preview/grammarRegistry/GrammarRegistry/byPublicId.md)