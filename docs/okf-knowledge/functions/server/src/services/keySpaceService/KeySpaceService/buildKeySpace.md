---
type: TypeScript Method
title: buildKeySpace
resource: server/src/services/keySpaceService.ts#L505-L547
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/isBuildStale
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async buildKeySpace(rootMapPath: string): Promise<KeySpace>`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [isBuildStale](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/isBuildStale.md)