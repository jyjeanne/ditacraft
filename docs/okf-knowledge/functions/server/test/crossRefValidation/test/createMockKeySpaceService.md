---
type: TypeScript Function
title: createMockKeySpaceService
resource: server/test/crossRefValidation.test.ts#L9-L34
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function createMockKeySpaceService( keys: Map<string, KeyDefinition>, duplicateKeys?: Map<string, KeyDefinition[]>, workspaceFolders: readonly string[] = [] ): KeySpaceService`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)