---
type: TypeScript Function
title: resolveWatchPublishOptions
resource: src/commands/watchModeCommand.ts#L200-L214
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/publishProfilesCommand/getLastUsedProfileName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/getPublishingProfiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/resolveProfileOutputDir
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/resolveDitavalPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/watchModeCommand/resolveWatchTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolveWatchPublishOptions(): { transtype: string; overrides?: WatchTarget['overrides'] }`

# Calls

- [getLastUsedProfileName](../../../../functions/src/commands/publishProfilesCommand/getLastUsedProfileName.md)
- [getPublishingProfiles](../../../../functions/src/commands/publishProfilesCommand/getPublishingProfiles.md)
- [resolveProfileOutputDir](../../../../functions/src/commands/publishProfilesCommand/resolveProfileOutputDir.md)
- [resolveDitavalPath](../../../../functions/src/commands/publishProfilesCommand/resolveDitavalPath.md)

# Called by

- [resolveWatchTarget](../../../../functions/src/commands/watchModeCommand/resolveWatchTarget.md)