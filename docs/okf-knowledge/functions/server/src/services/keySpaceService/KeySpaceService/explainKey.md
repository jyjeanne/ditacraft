---
type: TypeScript Method
title: explainKey
resource: server/src/services/keySpaceService.ts#L342-L452
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/followKeyrefChainWithTrace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/appendKeyrefSteps
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/tools/ditaExplainKey/handleDitaExplainKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async explainKey( keyName: string, contextFilePath: string ): Promise<KeyResolutionReport>`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [followKeyrefChainWithTrace](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/followKeyrefChainWithTrace.md)
- [appendKeyrefSteps](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/appendKeyrefSteps.md)

# Called by

- [handleDitaExplainKey](../../../../../../functions/mcp/src/tools/ditaExplainKey/handleDitaExplainKey.md)