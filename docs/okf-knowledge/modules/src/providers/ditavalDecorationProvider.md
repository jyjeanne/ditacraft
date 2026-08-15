---
type: TypeScript Module
title: ditavalDecorationProvider
resource: src/providers/ditavalDecorationProvider.ts#L1-L182
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs-promises
    resolved_by: tree-sitter
    confidence: exact
  - target: external/commands-previewcommand
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ditavalparser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-xmlelementscanner
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-constants
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-configurationmanager
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [loadActiveRules](../../../functions/src/providers/ditavalDecorationProvider/loadActiveRules.md)
- [exceedsLargeFileThreshold](../../../functions/src/providers/ditavalDecorationProvider/exceedsLargeFileThreshold.md)
- [recompute](../../../functions/src/providers/ditavalDecorationProvider/recompute.md)
- [scheduleRecompute](../../../functions/src/providers/ditavalDecorationProvider/scheduleRecompute.md)
- [registerConditionHighlighting](../../../functions/src/providers/ditavalDecorationProvider/registerConditionHighlighting.md)

# Imports

- `vscode`
- `fs/promises`
- `../commands/previewCommand`
- `../utils/ditavalParser`
- `../utils/xmlElementScanner`
- `../utils/constants`
- `../utils/configurationManager`
- `../utils/logger`

# Member of

- [ditacraft](../../../packages/ditacraft.md)