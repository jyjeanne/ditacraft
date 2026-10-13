---
type: TypeScript Method
title: extractTopicReferences
resource: server/src/services/keySpaceService.ts#L1621-L1647
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractTopicReferences( mapContent: string, mapPath: string, scopePrefix: string, topicToScope: Map<string, string>, maxMatches: number ): void`

# Calls

- [startsWith](../../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)