---
type: JavaScript Function
title: runGraphify
resource: scripts/generate-graph.js#L35-L44
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/scripts/generate-graph/rebuildGraph
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/generate-graph/publishOutputs
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function runGraphify(args, options = {})`

# Called by

- [rebuildGraph](../../../functions/scripts/generate-graph/rebuildGraph.md)
- [publishOutputs](../../../functions/scripts/generate-graph/publishOutputs.md)