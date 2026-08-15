---
type: JavaScript Function
title: publishOutputs
resource: scripts/generate-graph.js#L54-L71
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/scripts/generate-graph/runGraphify
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/generate-graph/folderReadme
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/scripts/generate-graph/watchAndPublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/generate-graph/main
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function publishOutputs()`

# Calls

- [runGraphify](../../../functions/scripts/generate-graph/runGraphify.md)
- [folderReadme](../../../functions/scripts/generate-graph/folderReadme.md)

# Called by

- [watchAndPublish](../../../functions/scripts/generate-graph/watchAndPublish.md)
- [main](../../../functions/scripts/generate-graph/main.md)