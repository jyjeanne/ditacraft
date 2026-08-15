---
type: TypeScript Module
title: llmRouterService
resource: src/llm/llmRouterService.ts#L1-L198
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-copilotprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-anthropicprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-openaiprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-ollamaprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/circuitbreaker
    resolved_by: tree-sitter
    confidence: exact
  - target: external/metricscollector
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [BreakerWrappedProvider](../../../classes/src/llm/llmRouterService/BreakerWrappedProvider.md)
- [constructor](../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/constructor.md)
- [id](../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/id.md)
- [displayName](../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/displayName.md)
- [supportsStreaming](../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/supportsStreaming.md)
- [maxContextTokens](../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/maxContextTokens.md)
- [estimateTokenCount](../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/estimateTokenCount.md)
- [isAvailable](../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/isAvailable.md)
- [complete](../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/complete.md)
- [stream](../../../functions/src/llm/llmRouterService/BreakerWrappedProvider/stream.md)
- [isAbortError](../../../functions/src/llm/llmRouterService/isAbortError.md)
- [LLMRouterService](../../../classes/src/llm/llmRouterService/LLMRouterService.md)
- [activeProvider](../../../functions/src/llm/llmRouterService/LLMRouterService/activeProvider.md)
- [setMetrics](../../../functions/src/llm/llmRouterService/LLMRouterService/setMetrics.md)
- [initialize](../../../functions/src/llm/llmRouterService/LLMRouterService/initialize.md)
- [forceProvider](../../../functions/src/llm/llmRouterService/LLMRouterService/forceProvider.md)
- [getProviderStatuses](../../../functions/src/llm/llmRouterService/LLMRouterService/getProviderStatuses.md)
- [buildProviders](../../../functions/src/llm/llmRouterService/LLMRouterService/buildProviders.md)

# Imports

- `vscode`
- `./types`
- `./providers/copilotProvider`
- `./providers/anthropicProvider`
- `./providers/openaiProvider`
- `./providers/ollamaProvider`
- `./circuitBreaker`
- `./metricsCollector`

# Member of

- [ditacraft](../../../packages/ditacraft.md)