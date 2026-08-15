---
type: TypeScript Function
title: stopLanguageClient
resource: src/languageClient.ts#L97-L103
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/deactivate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function stopLanguageClient(): Promise<void>`

# Calls

- [info](../../../functions/src/utils/logger/Logger/info.md)

# Called by

- [deactivate](../../../functions/src/extension/deactivate.md)