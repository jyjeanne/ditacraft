---
type: TypeScript Method
title: loadConfiguration
resource: src/utils/logger.ts#L46-L85
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/parseLogLevel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private loadConfiguration(): void`

# Calls

- [getConfiguration](../../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [parseLogLevel](../../../../../functions/src/utils/logger/Logger/parseLogLevel.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [info](../../../../../functions/src/utils/logger/Logger/info.md)