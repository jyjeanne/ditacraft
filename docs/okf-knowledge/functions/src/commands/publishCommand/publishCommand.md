---
type: TypeScript Function
title: publishCommand
resource: src/commands/publishCommand.ts#L74-L125
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/publishCommand/validateAndPrepareForPublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/getPublishingProfiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/pickProfileOrConfigureOnce
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/rememberLastUsedProfile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/executePublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/resolveProfileOutputDir
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/resolveDitavalPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/getAvailableTranstypes
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function publishCommand(uri?: vscode.Uri): Promise<void>`

# Calls

- [validateAndPrepareForPublish](../../../../functions/src/commands/publishCommand/validateAndPrepareForPublish.md)
- [getPublishingProfiles](../../../../functions/src/commands/publishProfilesCommand/getPublishingProfiles.md)
- [pickProfileOrConfigureOnce](../../../../functions/src/commands/publishCommand/pickProfileOrConfigureOnce.md)
- [rememberLastUsedProfile](../../../../functions/src/commands/publishProfilesCommand/rememberLastUsedProfile.md)
- [executePublish](../../../../functions/src/commands/publishCommand/executePublish.md)
- [resolveProfileOutputDir](../../../../functions/src/commands/publishProfilesCommand/resolveProfileOutputDir.md)
- [resolveDitavalPath](../../../../functions/src/commands/publishProfilesCommand/resolveDitavalPath.md)
- [getAvailableTranstypes](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getAvailableTranstypes.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)