---
type: TypeScript Method
title: doBuildKeySpace
resource: server/src/services/keySpaceService.ts#L744-L963
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/registerKeysForAdditionalScope
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/stripReltables
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/isSubjectSchemeMap
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async doBuildKeySpace(absoluteRootPath: string): Promise<KeySpace>`

# Calls

- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [registerKeysForAdditionalScope](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/registerKeysForAdditionalScope.md)
- [stripReltables](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/stripReltables.md)
- [isSubjectSchemeMap](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/isSubjectSchemeMap.md)