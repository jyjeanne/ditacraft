---
type: TypeScript Module
title: ditavalDecorationProvider
resource: src/providers/ditavalDecorationProvider.ts#L1-L248
generated:
  by: okf-rs/0.7.0
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
  - target: external/preview-ditaval
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-conditionmarks
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-render-types
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

- [flagDecorationType](../../../functions/src/providers/ditavalDecorationProvider/flagDecorationType.md)
- [flagAttachment](../../../functions/src/providers/ditavalDecorationProvider/flagAttachment.md)
- [disposeFlagDecorationTypes](../../../functions/src/providers/ditavalDecorationProvider/disposeFlagDecorationTypes.md)
- [flagHover](../../../functions/src/providers/ditavalDecorationProvider/flagHover.md)
- [clearDecorations](../../../functions/src/providers/ditavalDecorationProvider/clearDecorations.md)
- [loadActiveFilter](../../../functions/src/providers/ditavalDecorationProvider/loadActiveFilter.md)
- [exceedsLargeFileThreshold](../../../functions/src/providers/ditavalDecorationProvider/exceedsLargeFileThreshold.md)
- [recompute](../../../functions/src/providers/ditavalDecorationProvider/recompute.md)
- [scheduleRecompute](../../../functions/src/providers/ditavalDecorationProvider/scheduleRecompute.md)
- [registerConditionHighlighting](../../../functions/src/providers/ditavalDecorationProvider/registerConditionHighlighting.md)

# Imports

- `vscode`
- `fs/promises`
- `../commands/previewCommand`
- `../preview/ditaval`
- `../preview/conditionMarks`
- `../shared/render/types`
- `../utils/constants`
- `../utils/configurationManager`
- `../utils/logger`

# Member of

- [ditacraft](../../../packages/ditacraft.md)