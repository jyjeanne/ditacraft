---
type: TypeScript Module
title: watchModeCommand
resource: src/commands/watchModeCommand.ts#L1-L330
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs-promises
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ditaotwrapper
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ditaoterrorparser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/publishprofilescommand
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [WatchTarget](../../../interfaces/src/commands/watchModeCommand/WatchTarget.md)
- [WatchState](../../../interfaces/src/commands/watchModeCommand/WatchState.md)
- [isWatchModeActive](../../../functions/src/commands/watchModeCommand/isWatchModeActive.md)
- [startWatchModeCommand](../../../functions/src/commands/watchModeCommand/startWatchModeCommand.md)
- [stopWatchModeCommand](../../../functions/src/commands/watchModeCommand/stopWatchModeCommand.md)
- [disposeWatchMode](../../../functions/src/commands/watchModeCommand/disposeWatchMode.md)
- [scheduleRepublish](../../../functions/src/commands/watchModeCommand/scheduleRepublish.md)
- [resolveWatchTarget](../../../functions/src/commands/watchModeCommand/resolveWatchTarget.md)
- [pathExists](../../../functions/src/commands/watchModeCommand/pathExists.md)
- [resolveWatchPublishOptions](../../../functions/src/commands/watchModeCommand/resolveWatchPublishOptions.md)
- [setWatchingStatus](../../../functions/src/commands/watchModeCommand/setWatchingStatus.md)
- [runWatchPublish](../../../functions/src/commands/watchModeCommand/runWatchPublish.md)
- [flashStatus](../../../functions/src/commands/watchModeCommand/flashStatus.md)

# Imports

- `vscode`
- `path`
- `fs/promises`
- `../utils/ditaOtWrapper`
- `../utils/logger`
- `../utils/ditaOtErrorParser`
- `./publishProfilesCommand`

# Member of

- [ditacraft](../../../packages/ditacraft.md)