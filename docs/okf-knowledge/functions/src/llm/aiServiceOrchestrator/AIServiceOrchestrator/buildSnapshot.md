---
type: TypeScript Method
title: buildSnapshot
resource: src/llm/aiServiceOrchestrator.ts#L373-L382
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/restructureMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/explainElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/suggestReuse
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async buildSnapshot(uri: string, maxTokens: number): Promise<string | null>`

# Called by

- [restructureMap](../../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/restructureMap.md)
- [explainElement](../../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/explainElement.md)
- [suggestReuse](../../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/suggestReuse.md)