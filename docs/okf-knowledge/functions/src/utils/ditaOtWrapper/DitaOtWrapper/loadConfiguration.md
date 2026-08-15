---
type: TypeScript Method
title: loadConfiguration
resource: src/utils/ditaOtWrapper.ts#L105-L145
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
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

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [substituteWorkspaceFolderVar](../../../../../functions/src/utils/pathUtils/substituteWorkspaceFolderVar.md)
- [isValidPath](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/isValidPath.md)
- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)