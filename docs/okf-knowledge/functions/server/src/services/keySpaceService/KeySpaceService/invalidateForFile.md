---
type: TypeScript Method
title: invalidateForFile
resource: server/src/services/keySpaceService.ts#L684-L699
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/doInvalidate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public invalidateForFile(changedFile: string, pathChanged = false): void`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [doInvalidate](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/doInvalidate.md)