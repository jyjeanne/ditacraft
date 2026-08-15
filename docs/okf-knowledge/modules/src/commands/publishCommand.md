---
type: TypeScript Module
title: publishCommand
resource: src/commands/publishCommand.ts#L1-L323
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ditaotwrapper
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-errorutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ditaoterrorparser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/publishprofilescommand
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [validateAndPrepareForPublish](../../../functions/src/commands/publishCommand/validateAndPrepareForPublish.md)
- [publishCommand](../../../functions/src/commands/publishCommand/publishCommand.md)
- [pickProfileOrConfigureOnce](../../../functions/src/commands/publishCommand/pickProfileOrConfigureOnce.md)
- [publishHTML5Command](../../../functions/src/commands/publishCommand/publishHTML5Command.md)
- [PublishOverrides](../../../interfaces/src/commands/publishCommand/PublishOverrides.md)
- [executePublish](../../../functions/src/commands/publishCommand/executePublish.md)

# Imports

- `vscode`
- `path`
- `../utils/ditaOtWrapper`
- `../utils/logger`
- `../utils/errorUtils`
- `../utils/ditaOtErrorParser`
- `./publishProfilesCommand`

# Member of

- [ditacraft](../../../packages/ditacraft.md)