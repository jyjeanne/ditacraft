---
type: TypeScript Function
title: exceedsLargeFileThreshold
resource: src/providers/ditavalDecorationProvider.ts#L72-L79
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalDecorationProvider/recompute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function exceedsLargeFileThreshold(document: vscode.TextDocument): boolean`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [get](../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [recompute](../../../../functions/src/providers/ditavalDecorationProvider/recompute.md)