---
type: TypeScript Function
title: readMapsResource
resource: mcp/src/resources/maps.ts#L19-L61
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/moveTopic/isDirectory
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function readMapsResource(ctx: McpContext): Promise<MapsResourceResult>`

# Calls

- [isDirectory](../../../../../functions/server/src/features/moveTopic/isDirectory.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)