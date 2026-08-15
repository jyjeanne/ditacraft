---
type: TypeScript Function
title: getPublishingProfiles
resource: src/commands/publishProfilesCommand.ts#L31-L33
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
  - target: functions/src/commands/publishCommand/publishCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/managePublishingProfilesCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/resolveWatchPublishOptions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getPublishingProfiles(): PublishingProfile[]`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [get](../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [publishCommand](../../../../functions/src/commands/publishCommand/publishCommand.md)
- [managePublishingProfilesCommand](../../../../functions/src/commands/publishProfilesCommand/managePublishingProfilesCommand.md)
- [resolveWatchPublishOptions](../../../../functions/src/commands/watchModeCommand/resolveWatchPublishOptions.md)