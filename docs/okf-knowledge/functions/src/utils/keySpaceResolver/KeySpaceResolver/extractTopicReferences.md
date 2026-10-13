---
type: TypeScript Method
title: extractTopicReferences
resource: src/utils/keySpaceResolver.ts#L997-L1023
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractTopicReferences( mapContent: string, mapPath: string, scopePrefix: string, topicToScope: Map<string, string> ): void`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [normalizePathForComparison](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)