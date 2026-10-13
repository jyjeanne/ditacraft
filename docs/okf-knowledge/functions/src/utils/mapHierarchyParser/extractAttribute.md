---
type: TypeScript Function
title: extractAttribute
resource: src/utils/mapHierarchyParser.ts#L31-L35
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/mapHierarchyParser/parseReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function extractAttribute(attributes: string, name: string): string | null`

# Calls

- [match](../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [parseReferences](../../../../functions/src/utils/mapHierarchyParser/parseReferences.md)