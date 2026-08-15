---
type: TypeScript Method
title: appendKeyrefSteps
resource: server/src/services/keySpaceService.ts#L1440-L1457
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/explainKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private appendKeyrefSteps( steps: ResolutionStep[], chain: string[], keys: Map<string, KeyDefinition> ): void`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [explainKey](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/explainKey.md)