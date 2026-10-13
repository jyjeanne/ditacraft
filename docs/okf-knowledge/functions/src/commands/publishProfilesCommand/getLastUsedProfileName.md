---
type: TypeScript Function
title: getLastUsedProfileName
resource: src/commands/publishProfilesCommand.ts#L78-L81
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/publishCommand/pickProfileOrConfigureOnce
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/resolveWatchPublishOptions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getLastUsedProfileName(): string | undefined`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)

# Called by

- [pickProfileOrConfigureOnce](../../../../functions/src/commands/publishCommand/pickProfileOrConfigureOnce.md)
- [resolveWatchPublishOptions](../../../../functions/src/commands/watchModeCommand/resolveWatchPublishOptions.md)