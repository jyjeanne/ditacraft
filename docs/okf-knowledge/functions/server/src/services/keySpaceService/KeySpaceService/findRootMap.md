---
type: TypeScript Method
title: findRootMap
resource: server/src/services/keySpaceService.ts#L570-L609
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/doFindRootMap
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async findRootMap(filePath: string): Promise<string | null>`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [doFindRootMap](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/doFindRootMap.md)