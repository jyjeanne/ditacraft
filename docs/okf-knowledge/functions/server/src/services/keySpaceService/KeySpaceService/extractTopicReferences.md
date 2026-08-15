---
type: TypeScript Method
title: extractTopicReferences
resource: server/src/services/keySpaceService.ts#L1466-L1492
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractTopicReferences( mapContent: string, mapPath: string, scopePrefix: string, topicToScope: Map<string, string>, maxMatches: number ): void`

# Calls

- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)