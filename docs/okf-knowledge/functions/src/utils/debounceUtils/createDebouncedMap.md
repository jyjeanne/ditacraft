---
type: TypeScript Function
title: createDebouncedMap
resource: src/utils/debounceUtils.ts#L59-L104
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function createDebouncedMap<K, V>( handler: (key: K, value: V) => Promise<void> | void, delayMs: number ): DebouncedMap<K, V>`

# Calls

- [get](../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)