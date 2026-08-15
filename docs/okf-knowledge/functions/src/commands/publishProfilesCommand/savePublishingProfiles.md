---
type: TypeScript Function
title: savePublishingProfiles
resource: src/commands/publishProfilesCommand.ts#L35-L38
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/publishProfilesCommand/managePublishingProfilesCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function savePublishingProfiles(profiles: PublishingProfile[]): Promise<void>`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)

# Called by

- [managePublishingProfilesCommand](../../../../functions/src/commands/publishProfilesCommand/managePublishingProfilesCommand.md)