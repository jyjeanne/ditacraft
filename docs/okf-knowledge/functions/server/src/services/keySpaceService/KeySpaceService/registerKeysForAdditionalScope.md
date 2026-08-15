---
type: TypeScript Method
title: registerKeysForAdditionalScope
resource: server/src/services/keySpaceService.ts#L1689-L1715
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/doBuildKeySpace
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private registerKeysForAdditionalScope( keySpace: KeySpace, scopeDirectKeys: Map<string, KeyDefinition[]>, keys: KeyDefinition[], scopePrefixes: string[], rootScopes: string[] ): void`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [doBuildKeySpace](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/doBuildKeySpace.md)