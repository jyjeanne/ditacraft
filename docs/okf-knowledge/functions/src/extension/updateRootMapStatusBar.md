---
type: TypeScript Function
title: updateRootMapStatusBar
resource: src/extension.ts#L435-L445
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/extension/registerRootMapFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/sendInitialRootMapSetting
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function updateRootMapStatusBar(rootMapName: string | null): void`

# Called by

- [registerRootMapFeature](../../../functions/src/extension/registerRootMapFeature.md)
- [sendInitialRootMapSetting](../../../functions/src/extension/sendInitialRootMapSetting.md)