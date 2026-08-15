---
type: TypeScript Function
title: parseReferences
resource: src/utils/mapHierarchyParser.ts#L61-L129
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/mapHierarchyParser/extractAttribute
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/mapHierarchyParser/parseMapHierarchy
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function parseReferences( content: string, mapDir: string, visitedFiles: Set<string> ): Promise<MapNode[]>`

# Calls

- [extractAttribute](../../../../functions/src/utils/mapHierarchyParser/extractAttribute.md)

# Called by

- [parseMapHierarchy](../../../../functions/src/utils/mapHierarchyParser/parseMapHierarchy.md)