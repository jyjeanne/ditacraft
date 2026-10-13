---
type: TypeScript Function
title: localMaps
resource: src/preview/mapContexts.ts#L275-L301
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/EditorSession/isMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/isDirectory
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/mapContexts/MapContexts/loadMaps
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function localMaps(folder: string): string[]`

# Calls

- [isMap](../../../../functions/src/editor/visualEditorProvider/EditorSession/isMap.md)
- [isDirectory](../../../../functions/server/src/features/moveTopic/isDirectory.md)
- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [loadMaps](../../../../functions/src/preview/mapContexts/MapContexts/loadMaps.md)