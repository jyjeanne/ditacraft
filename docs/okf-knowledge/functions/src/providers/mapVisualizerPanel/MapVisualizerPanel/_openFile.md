---
type: TypeScript Method
title: _openFile
resource: src/providers/mapVisualizerPanel.ts#L135-L145
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/mapVisualizerPanel/MapVisualizerPanel/_handleMessage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _openFile(filePath: string): Promise<void>`

# Calls

- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [_handleMessage](../../../../../functions/src/providers/mapVisualizerPanel/MapVisualizerPanel/_handleMessage.md)