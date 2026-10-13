---
type: TypeScript Function
title: promptForProfile
resource: src/commands/publishProfilesCommand.ts#L211-L255
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/publishProfilesCommand/pickTranstype
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/promptForDitaval
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/publishProfilesCommand/managePublishingProfilesCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function promptForProfile( otherProfiles: PublishingProfile[], existing?: PublishingProfile ): Promise<PublishingProfile | undefined>`

# Calls

- [pickTranstype](../../../../functions/src/commands/publishProfilesCommand/pickTranstype.md)
- [promptForDitaval](../../../../functions/src/commands/publishProfilesCommand/promptForDitaval.md)

# Called by

- [managePublishingProfilesCommand](../../../../functions/src/commands/publishProfilesCommand/managePublishingProfilesCommand.md)