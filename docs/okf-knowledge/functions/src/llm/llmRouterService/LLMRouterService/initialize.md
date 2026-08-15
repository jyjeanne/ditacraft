---
type: TypeScript Method
title: initialize
resource: src/llm/llmRouterService.ts#L110-L137
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/llm/llmRouterService/LLMRouterService/buildProviders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/metricsCollector/MetricsCollector/record
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async initialize(config: DitaCraftLLMConfig): Promise<void>`

# Calls

- [buildProviders](../../../../../functions/src/llm/llmRouterService/LLMRouterService/buildProviders.md)
- [record](../../../../../functions/src/llm/metricsCollector/MetricsCollector/record.md)