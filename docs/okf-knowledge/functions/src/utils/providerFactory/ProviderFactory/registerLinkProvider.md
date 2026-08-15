---
type: TypeScript Method
title: registerLinkProvider
resource: src/utils/providerFactory.ts#L79-L105
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/providerFactory/ProviderFactory/getLinkProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/providerFactory/ProviderFactory/registerAllProviders
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public registerLinkProvider(): vscode.Disposable[]`

# Calls

- [getLinkProvider](../../../../../functions/src/utils/providerFactory/ProviderFactory/getLinkProvider.md)
- [info](../../../../../functions/src/utils/logger/Logger/info.md)

# Called by

- [registerAllProviders](../../../../../functions/src/utils/providerFactory/ProviderFactory/registerAllProviders.md)