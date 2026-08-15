---
type: TypeScript Method
title: getLinkProvider
resource: src/utils/providerFactory.ts#L65-L73
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/providerFactory/ProviderFactory/registerLinkProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/providerFactory/ProviderFactory/registerAllProviders
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public getLinkProvider(): DitaLinkProvider`

# Calls

- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [registerLinkProvider](../../../../../functions/src/utils/providerFactory/ProviderFactory/registerLinkProvider.md)
- [registerAllProviders](../../../../../functions/src/utils/providerFactory/ProviderFactory/registerAllProviders.md)