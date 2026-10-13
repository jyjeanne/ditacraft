---
type: TypeScript Method
title: explainKey
resource: server/src/services/keySpaceService.ts#L404-L514
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/followKeyrefChainWithTrace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/appendKeyrefSteps
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
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

- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [followKeyrefChainWithTrace](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/followKeyrefChainWithTrace.md)
- [appendKeyrefSteps](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/appendKeyrefSteps.md)
- [basename](../../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [handleDitaExplainKey](../../../../../../functions/mcp/src/tools/ditaExplainKey/handleDitaExplainKey.md)