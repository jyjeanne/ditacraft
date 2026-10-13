---
type: TypeScript Function
title: getHrefHover
resource: server/src/features/hover.ts#L161-L228
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
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

`async function getHrefHover( ref: { type: string; value: string }, documentUri: string, workspaceFolders: readonly string[] ): Promise<Hover | null>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [getConrefPreview](../../../../../functions/server/src/features/hover/getConrefPreview.md)

# Called by

- [handleHover](../../../../../functions/server/src/features/hover/handleHover.md)