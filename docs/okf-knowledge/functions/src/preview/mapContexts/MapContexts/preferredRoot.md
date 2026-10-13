---
type: TypeScript Method
title: preferredRoot
resource: src/preview/mapContexts.ts#L151-L158
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/mapContexts/MapContexts/places
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private preferredRoot(): string | undefined`

# Calls

- [getConfiguration](../../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)

# Called by

- [places](../../../../../functions/src/preview/mapContexts/MapContexts/places.md)