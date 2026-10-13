---
type: TypeScript Module
title: configureAICommand
resource: src/commands/configureAICommand.ts#L1-L463
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/llm-llmrouterservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/llm-secretmanager
    resolved_by: tree-sitter
    confidence: exact
  - target: external/llm-aienabled
    resolved_by: tree-sitter
    confidence: exact
  - target: external/llm-llmconfig
    resolved_by: tree-sitter
    confidence: exact
  - target: external/llm-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-errorutils
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [ProviderRow](../../../interfaces/src/commands/configureAICommand/ProviderRow.md)
- [PanelState](../../../interfaces/src/commands/configureAICommand/PanelState.md)
- [describeProviders](../../../functions/src/commands/configureAICommand/describeProviders.md)
- [configureAICommand](../../../functions/src/commands/configureAICommand/configureAICommand.md)
- [PageMessage](../../../interfaces/src/commands/configureAICommand/PageMessage.md)
- [AiSettingsPanel](../../../classes/src/commands/configureAICommand/AiSettingsPanel.md)
- [constructor](../../../functions/src/commands/configureAICommand/AiSettingsPanel/constructor.md)
- [reveal](../../../functions/src/commands/configureAICommand/AiSettingsPanel/reveal.md)
- [redetect](../../../functions/src/commands/configureAICommand/AiSettingsPanel/redetect.md)
- [handle](../../../functions/src/commands/configureAICommand/AiSettingsPanel/handle.md)
- [post](../../../functions/src/commands/configureAICommand/AiSettingsPanel/post.md)
- [buildSettingsHtml](../../../functions/src/commands/configureAICommand/buildSettingsHtml.md)

# Imports

- `vscode`
- `../llm/llmRouterService`
- `../llm/secretManager`
- `../llm/aiEnabled`
- `../llm/llmConfig`
- `../llm/types`
- `../utils/errorUtils`

# Member of

- [ditacraft](../../../packages/ditacraft.md)