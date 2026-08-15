---
type: TypeScript Function
title: managePublishingProfilesCommand
resource: src/commands/publishProfilesCommand.ts#L92-L157
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/publishProfilesCommand/getPublishingProfiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/describeProfile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/promptForProfile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/savePublishingProfiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function managePublishingProfilesCommand(): Promise<void>`

# Calls

- [getPublishingProfiles](../../../../functions/src/commands/publishProfilesCommand/getPublishingProfiles.md)
- [describeProfile](../../../../functions/src/commands/publishProfilesCommand/describeProfile.md)
- [promptForProfile](../../../../functions/src/commands/publishProfilesCommand/promptForProfile.md)
- [savePublishingProfiles](../../../../functions/src/commands/publishProfilesCommand/savePublishingProfiles.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)