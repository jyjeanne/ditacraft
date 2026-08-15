---
type: TypeScript Function
title: restructureMapCommand
resource: src/commands/restructureMapCommand.ts#L32-L99
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/restructureMapCommand/isDitaMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/restructureMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/restructureMapCommand/showDiffAndApply
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/getErrorMessage
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function restructureMapCommand( orchestrator: AIServiceOrchestrator, mapUri?: vscode.Uri ): Promise<void>`

# Calls

- [isDitaMap](../../../../functions/src/commands/restructureMapCommand/isDitaMap.md)
- [restructureMap](../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/restructureMap.md)
- [showDiffAndApply](../../../../functions/src/commands/restructureMapCommand/showDiffAndApply.md)
- [getErrorMessage](../../../../functions/src/utils/errorUtils/getErrorMessage.md)

# Called by

- [activate](../../../../functions/src/extension/activate.md)