---
type: TypeScript Method
title: _updateAsync
resource: src/providers/mapVisualizerPanel.ts#L161-L164
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/mapHierarchyParser/parseMapHierarchy
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/mapVisualizerPanel/MapVisualizerPanel/_update
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _updateAsync(): Promise<void>`

# Calls

- [parseMapHierarchy](../../../../../functions/src/utils/mapHierarchyParser/parseMapHierarchy.md)

# Called by

- [_update](../../../../../functions/src/providers/mapVisualizerPanel/MapVisualizerPanel/_update.md)