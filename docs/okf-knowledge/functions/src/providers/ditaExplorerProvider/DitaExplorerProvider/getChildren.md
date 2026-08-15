---
type: TypeScript Method
title: getChildren
resource: src/providers/ditaExplorerProvider.ts#L129-L159
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/mapHierarchyParser/findAllMapsInWorkspace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/mapHierarchyParser/parseMapHierarchy
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async getChildren(element?: DitaExplorerItem): Promise<DitaExplorerItem[]>`

# Calls

- [findAllMapsInWorkspace](../../../../../functions/src/utils/mapHierarchyParser/findAllMapsInWorkspace.md)
- [parseMapHierarchy](../../../../../functions/src/utils/mapHierarchyParser/parseMapHierarchy.md)
- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)