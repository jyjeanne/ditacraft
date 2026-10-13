---
type: TypeScript Module
title: openaiProvider
resource: src/llm/providers/openaiProvider.ts#L1-L131
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/openai
    resolved_by: tree-sitter
    confidence: exact
  - target: external/openai-resources-chat-completions
    resolved_by: tree-sitter
    confidence: exact
  - target: external/types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/connectioncheck
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [isReasoningModel](../../../../functions/src/llm/providers/openaiProvider/isReasoningModel.md)
- [chatParameters](../../../../functions/src/llm/providers/openaiProvider/chatParameters.md)
- [OpenAILLMProvider](../../../../classes/src/llm/providers/openaiProvider/OpenAILLMProvider.md)
- [displayName](../../../../functions/src/llm/providers/openaiProvider/OpenAILLMProvider/displayName.md)
- [constructor](../../../../functions/src/llm/providers/openaiProvider/OpenAILLMProvider/constructor.md)
- [isAvailable](../../../../functions/src/llm/providers/openaiProvider/OpenAILLMProvider/isAvailable.md)
- [checkConnection](../../../../functions/src/llm/providers/openaiProvider/OpenAILLMProvider/checkConnection.md)
- [complete](../../../../functions/src/llm/providers/openaiProvider/OpenAILLMProvider/complete.md)
- [stream](../../../../functions/src/llm/providers/openaiProvider/OpenAILLMProvider/stream.md)
- [estimateTokenCount](../../../../functions/src/llm/providers/openaiProvider/OpenAILLMProvider/estimateTokenCount.md)
- [openaiFailure](../../../../functions/src/llm/providers/openaiProvider/openaiFailure.md)

# Imports

- `openai`
- `openai/resources/chat/completions`
- `../types`
- `./connectionCheck`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)