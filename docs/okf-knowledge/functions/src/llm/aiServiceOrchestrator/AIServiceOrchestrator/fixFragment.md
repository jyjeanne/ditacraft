---
type: TypeScript Method
title: fixFragment
resource: src/llm/aiServiceOrchestrator.ts#L217-L265
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/llm/aiServiceOrchestrator/tokenToSignal
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/extractXml
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/aiQuickFixProvider/executeAiQuickFix
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async fixFragment( fragment: string, diagnostic: vscode.Diagnostic, contextUri: string, token?: vscode.CancellationToken ): Promise<FixFragmentResult>`

# Calls

- [tokenToSignal](../../../../../functions/src/llm/aiServiceOrchestrator/tokenToSignal.md)
- [extractXml](../../../../../functions/src/llm/aiServiceOrchestrator/extractXml.md)

# Called by

- [executeAiQuickFix](../../../../../functions/src/providers/aiQuickFixProvider/executeAiQuickFix.md)