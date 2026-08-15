---
type: TypeScript Method
title: registerAllProviders
resource: src/utils/providerFactory.ts#L111-L121
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/providerFactory/ProviderFactory/getLinkProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/providerFactory/ProviderFactory/registerLinkProvider
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public registerAllProviders(): { linkProvider: DitaLinkProvider; linkProviderRegistrations: vscode.Disposable[]; keySpaceResolver: KeySpaceResolver; }`

# Calls

- [getLinkProvider](../../../../../functions/src/utils/providerFactory/ProviderFactory/getLinkProvider.md)
- [registerLinkProvider](../../../../../functions/src/utils/providerFactory/ProviderFactory/registerLinkProvider.md)