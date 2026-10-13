---
type: TypeScript Method
title: resolveKey
resource: src/preview/mapContexts.ts#L264-L271
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKeyInMap
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async resolveKey(key: string, file: string, context: TopicContext | undefined): Promise<KeyDefinitionLike | null>`

# Calls

- [getGlobalKeySpaceResolver](../../../../../functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver.md)
- [resolveKeyInMap](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKeyInMap.md)