---
type: TypeScript Function
title: scanKeyUsages
resource: src/utils/keyUsageScanner.ts#L44-L107
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/_buildTree
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function scanKeyUsages(): Promise<Map<string, KeyUsage[]>>`

# Calls

- [get](../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [_buildTree](../../../../functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/_buildTree.md)