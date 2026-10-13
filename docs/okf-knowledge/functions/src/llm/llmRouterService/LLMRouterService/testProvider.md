---
type: TypeScript Method
title: testProvider
resource: src/llm/llmRouterService.ts#L184-L202
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async testProvider(providerId: ProviderId, signal: AbortSignal = new AbortController().signal): Promise<ConnectionCheck>`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [handle](../../../../../functions/src/commands/configureAICommand/AiSettingsPanel/handle.md)