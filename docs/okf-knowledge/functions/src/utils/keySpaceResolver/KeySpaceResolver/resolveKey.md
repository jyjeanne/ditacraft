---
type: TypeScript Method
title: resolveKey
resource: src/utils/keySpaceResolver.ts#L1272-L1347
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async resolveKey( keyName: string, contextFilePath: string ): Promise<KeyDefinition | null>`

# Calls

- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [normalizePathForComparison](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison.md)