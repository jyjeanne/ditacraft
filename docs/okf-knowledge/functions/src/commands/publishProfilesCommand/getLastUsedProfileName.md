---
type: TypeScript Function
title: getLastUsedProfileName
resource: src/commands/publishProfilesCommand.ts#L41-L44
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
- [get](../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [pickProfileOrConfigureOnce](../../../../functions/src/commands/publishCommand/pickProfileOrConfigureOnce.md)
- [resolveWatchPublishOptions](../../../../functions/src/commands/watchModeCommand/resolveWatchPublishOptions.md)