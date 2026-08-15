---
type: TypeScript Module
title: providerFactory
resource: src/utils/providerFactory.ts#L1-L183
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/keyspaceresolver
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-ditalinkprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/logger
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [ProviderFactoryOptions](../../../interfaces/src/utils/providerFactory/ProviderFactoryOptions.md)
- [ProviderFactory](../../../classes/src/utils/providerFactory/ProviderFactory.md)
- [constructor](../../../functions/src/utils/providerFactory/ProviderFactory/constructor.md)
- [getKeySpaceResolver](../../../functions/src/utils/providerFactory/ProviderFactory/getKeySpaceResolver.md)
- [getLinkProvider](../../../functions/src/utils/providerFactory/ProviderFactory/getLinkProvider.md)
- [registerLinkProvider](../../../functions/src/utils/providerFactory/ProviderFactory/registerLinkProvider.md)
- [registerAllProviders](../../../functions/src/utils/providerFactory/ProviderFactory/registerAllProviders.md)
- [dispose](../../../functions/src/utils/providerFactory/ProviderFactory/dispose.md)
- [getProviderFactory](../../../functions/src/utils/providerFactory/getProviderFactory.md)
- [disposeProviderFactory](../../../functions/src/utils/providerFactory/disposeProviderFactory.md)
- [isProviderFactoryInitialized](../../../functions/src/utils/providerFactory/isProviderFactoryInitialized.md)

# Imports

- `vscode`
- `./keySpaceResolver`
- `../providers/ditaLinkProvider`
- `./logger`

# Member of

- [ditacraft](../../../packages/ditacraft.md)