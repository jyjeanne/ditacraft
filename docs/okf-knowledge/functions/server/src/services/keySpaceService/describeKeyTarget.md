---
type: TypeScript Function
title: describeKeyTarget
resource: server/src/services/keySpaceService.ts#L172-L176
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/reportKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/formatResolutionReport
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function describeKeyTarget(def: KeyDefinition): string`

# Calls

- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [reportKeySpace](../../../../../functions/server/src/services/keySpaceService/reportKeySpace.md)
- [formatResolutionReport](../../../../../functions/server/src/services/keySpaceService/formatResolutionReport.md)