---
type: TypeScript Method
title: loadCacheConfig
resource: src/utils/keySpaceResolver.ts#L173-L179
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/reloadCacheConfig
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private loadCacheConfig(): CacheConfig`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [constructor](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/constructor.md)
- [reloadCacheConfig](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/reloadCacheConfig.md)