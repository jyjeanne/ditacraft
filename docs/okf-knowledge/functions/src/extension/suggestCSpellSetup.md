---
type: TypeScript Function
title: suggestCSpellSetup
resource: src/extension.ts#L1306-L1358
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function suggestCSpellSetup(context: vscode.ExtensionContext): Promise<void>`

# Calls

- [getConfiguration](../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)