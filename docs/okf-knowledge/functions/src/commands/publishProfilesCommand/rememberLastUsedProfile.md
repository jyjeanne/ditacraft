---
type: TypeScript Function
title: rememberLastUsedProfile
resource: src/commands/publishProfilesCommand.ts#L46-L49
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/publishCommand/publishCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function rememberLastUsedProfile(name: string): Promise<void>`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)

# Called by

- [publishCommand](../../../../functions/src/commands/publishCommand/publishCommand.md)