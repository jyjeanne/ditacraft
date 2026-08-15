---
type: TypeScript Method
title: record
resource: src/llm/metricsCollector.ts#L33-L54
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/llm/llmRouterService/LLMRouterService/initialize
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`record(metric: Omit<AICallMetric, 'timestamp'>): void`

# Calls

- [getConfiguration](../../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)

# Called by

- [initialize](../../../../../functions/src/llm/llmRouterService/LLMRouterService/initialize.md)