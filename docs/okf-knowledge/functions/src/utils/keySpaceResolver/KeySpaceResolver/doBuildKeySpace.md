---
type: TypeScript Method
title: doBuildKeySpace
resource: src/utils/keySpaceResolver.ts#L435-L606
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/suite/keySpaceResolver/test/normalize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/readFileAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async doBuildKeySpace(absoluteRootPath: string): Promise<KeySpace>`

# Calls

- [info](../../../../../functions/src/utils/logger/Logger/info.md)
- [normalize](../../../../../functions/src/test/suite/keySpaceResolver/test/normalize.md)
- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)
- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)
- [readFileAsync](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/readFileAsync.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)