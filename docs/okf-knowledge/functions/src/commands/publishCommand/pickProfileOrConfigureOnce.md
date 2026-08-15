---
type: TypeScript Function
title: pickProfileOrConfigureOnce
resource: src/commands/publishCommand.ts#L133-L162
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/publishProfilesCommand/getLastUsedProfileName
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/publishCommand/publishCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function pickProfileOrConfigureOnce( profiles: PublishingProfile[] ): Promise<PublishingProfile | null | undefined>`

# Calls

- [getLastUsedProfileName](../../../../functions/src/commands/publishProfilesCommand/getLastUsedProfileName.md)

# Called by

- [publishCommand](../../../../functions/src/commands/publishCommand/publishCommand.md)