---
type: TypeScript Function
title: resolveTemplatedOrGeneratedContent
resource: src/commands/fileCreationCommands.ts#L163-L187
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/templateEngine/loadTemplateRaw
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/humanizeFileName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/templateEngine/substitutePlaceholders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/todayIso
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/fileCreationCommands/newTopicCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/newMapCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function resolveTemplatedOrGeneratedContent( templateContext: TemplateContext, baseName: string, extension: string, id: string, titlePromptLabel: string, fallback: () => string ): Promise<string | undefined>`

# Calls

- [loadTemplateRaw](../../../../functions/src/utils/templateEngine/loadTemplateRaw.md)
- [humanizeFileName](../../../../functions/src/commands/fileCreationCommands/humanizeFileName.md)
- [substitutePlaceholders](../../../../functions/src/utils/templateEngine/substitutePlaceholders.md)
- [todayIso](../../../../functions/src/commands/fileCreationCommands/todayIso.md)

# Called by

- [newTopicCommand](../../../../functions/src/commands/fileCreationCommands/newTopicCommand.md)
- [newMapCommand](../../../../functions/src/commands/fileCreationCommands/newMapCommand.md)