---
type: TypeScript Method
title: registerKeysForAdditionalScope
resource: server/src/services/keySpaceService.ts#L1851-L1877
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
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

- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [doBuildKeySpace](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/doBuildKeySpace.md)