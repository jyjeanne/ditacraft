---
type: TypeScript Function
title: extractXml
resource: src/llm/aiServiceOrchestrator.ts#L404-L414
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/restructureMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/fixFragment
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function extractXml(text: string): string | null`

# Calls

- [match](../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [restructureMap](../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/restructureMap.md)
- [fixFragment](../../../../functions/src/llm/aiServiceOrchestrator/AIServiceOrchestrator/fixFragment.md)