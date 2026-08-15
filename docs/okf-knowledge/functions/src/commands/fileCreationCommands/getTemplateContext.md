---
type: TypeScript Function
title: getTemplateContext
resource: src/commands/fileCreationCommands.ts#L72-L80
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/templateEngine/resolveTemplatesDir
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/fileCreationCommands/newTopicCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/newMapCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/newBookmapCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/runProjectInit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getTemplateContext(): TemplateContext`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [get](../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [resolveTemplatesDir](../../../../functions/src/utils/templateEngine/resolveTemplatesDir.md)

# Called by

- [newTopicCommand](../../../../functions/src/commands/fileCreationCommands/newTopicCommand.md)
- [newMapCommand](../../../../functions/src/commands/fileCreationCommands/newMapCommand.md)
- [newBookmapCommand](../../../../functions/src/commands/fileCreationCommands/newBookmapCommand.md)
- [runProjectInit](../../../../functions/src/commands/fileCreationCommands/runProjectInit.md)