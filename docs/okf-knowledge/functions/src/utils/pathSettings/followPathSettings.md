---
type: TypeScript Function
title: followPathSettings
resource: src/utils/pathSettings.ts#L18-L44
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/movedPaths/resolvePathSetting
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/movedPaths/movedPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/movedPaths/pathSettingValue
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerPathFollowing
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function followPathSettings(moves: readonly PathMove[]): Promise<PathSetting[]>`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [resolvePathSetting](../../../../functions/src/utils/movedPaths/resolvePathSetting.md)
- [movedPath](../../../../functions/src/utils/movedPaths/movedPath.md)
- [pathSettingValue](../../../../functions/src/utils/movedPaths/pathSettingValue.md)

# Called by

- [registerPathFollowing](../../../../functions/src/extension/registerPathFollowing.md)