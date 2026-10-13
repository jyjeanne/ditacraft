---
type: TypeScript Function
title: getKeyrefHover
resource: server/src/features/hover.ts#L90-L154
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/getConrefPreview
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/hover/handleHover
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function getKeyrefHover( ref: { type: string; value: string }, documentUri: string, keySpaceService: KeySpaceService ): Promise<Hover | null>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [getConrefPreview](../../../../../functions/server/src/features/hover/getConrefPreview.md)

# Called by

- [handleHover](../../../../../functions/server/src/features/hover/handleHover.md)