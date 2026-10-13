---
type: TypeScript Function
title: chatParameters
resource: src/llm/providers/openaiProvider.ts#L28-L36
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/llm/providers/openaiProvider/isReasoningModel
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/llm/providers/openaiProvider/OpenAILLMProvider/stream
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function chatParameters(model: string, request: LLMRequest): Pick<ChatCompletionCreateParamsStreaming, 'max_completion_tokens' | 'temperature' | 'reasoning_effort'>`

# Calls

- [isReasoningModel](../../../../../functions/src/llm/providers/openaiProvider/isReasoningModel.md)

# Called by

- [stream](../../../../../functions/src/llm/providers/openaiProvider/OpenAILLMProvider/stream.md)