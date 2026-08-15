---
type: TypeScript Function
title: showWelcomeMessage
resource: src/extension.ts#L1154-L1183
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function showWelcomeMessage(context: vscode.ExtensionContext): Promise<void>`

# Calls

- [get](../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)