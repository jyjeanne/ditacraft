---
type: TypeScript Method
title: loadConfiguration
resource: src/utils/ditaOtWrapper.ts#L122-L162
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/pathUtils/substituteWorkspaceFolderVar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/isValidPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private loadConfiguration(): DitaOtConfig`

# Calls

- [substituteWorkspaceFolderVar](../../../../../functions/src/utils/pathUtils/substituteWorkspaceFolderVar.md)
- [isValidPath](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/isValidPath.md)
- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)