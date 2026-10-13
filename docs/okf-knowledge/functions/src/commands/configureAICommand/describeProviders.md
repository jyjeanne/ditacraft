---
type: TypeScript Function
title: describeProviders
resource: src/commands/configureAICommand.ts#L76-L125
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/post
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/suite/configureAI/test/rows
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function describeProviders( config: DitaCraftLLMConfig, available: ReadonlyMap<string, boolean>, keys: Readonly<Record<'anthropic' | 'openai', KeySource>>, checks: ReadonlyMap<string, ConnectionCheck> = new Map() ): ProviderRow[]`

# Calls

- [has](../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [post](../../../../functions/src/commands/configureAICommand/AiSettingsPanel/post.md)
- [rows](../../../../functions/src/test/suite/configureAI/test/rows.md)