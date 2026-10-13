---
type: TypeScript Function
title: summarizeSkipped
resource: src/commands/batchMetadataCommand.ts#L148-L153
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function summarizeSkipped(skipped: readonly BatchMetadataSkippedFile[]): string`

# Calls

- [basename](../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [batchUpdateMetadataCommand](../../../../functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand.md)