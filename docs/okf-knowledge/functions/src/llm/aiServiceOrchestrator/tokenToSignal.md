---
type: TypeScript Function
title: tokenToSignal
resource: src/llm/aiServiceOrchestrator.ts#L417-L427
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/restructureMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/explainDiagnostic
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/fixFragment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/explainElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/suggestReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/streamRaw
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function tokenToSignal(token?: vscode.CancellationToken): AbortSignal`

# Called by

- [restructureMap](../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/restructureMap.md)
- [explainDiagnostic](../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/explainDiagnostic.md)
- [fixFragment](../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/fixFragment.md)
- [explainElement](../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/explainElement.md)
- [suggestReuse](../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/suggestReuse.md)
- [streamRaw](../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/streamRaw.md)