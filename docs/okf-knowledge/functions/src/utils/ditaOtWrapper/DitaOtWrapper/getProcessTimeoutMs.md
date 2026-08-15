---
type: TypeScript Method
title: getProcessTimeoutMs
resource: src/utils/ditaOtWrapper.ts#L151-L154
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private getProcessTimeoutMs(): number`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [publish](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)