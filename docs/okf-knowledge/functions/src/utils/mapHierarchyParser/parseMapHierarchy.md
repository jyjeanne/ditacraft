---
type: TypeScript Function
title: parseMapHierarchy
resource: src/utils/mapHierarchyParser.ts#L134-L154
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/mapHierarchyParser/detectMapType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/mapHierarchyParser/parseReferences
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditaExplorerProvider/DitaExplorerProvider/getChildren
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/mapVisualizerPanel/MapVisualizerPanel/_updateAsync
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function parseMapHierarchy(mapFilePath: string): Promise<MapNode>`

# Calls

- [detectMapType](../../../../functions/src/utils/mapHierarchyParser/detectMapType.md)
- [parseReferences](../../../../functions/src/utils/mapHierarchyParser/parseReferences.md)

# Called by

- [getChildren](../../../../functions/src/providers/ditaExplorerProvider/DitaExplorerProvider/getChildren.md)
- [_updateAsync](../../../../functions/src/providers/mapVisualizerPanel/MapVisualizerPanel/_updateAsync.md)