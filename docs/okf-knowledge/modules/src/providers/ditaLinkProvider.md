---
type: TypeScript Module
title: ditaLinkProvider
resource: src/providers/ditaLinkProvider.ts#L1-L944
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-keyspaceresolver
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-configurationmanager
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [PendingKeyLink](../../../interfaces/src/providers/ditaLinkProvider/PendingKeyLink.md)
- [DitaLinkProvider](../../../classes/src/providers/ditaLinkProvider/DitaLinkProvider.md)
- [constructor](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/constructor.md)
- [getValueStartOffset](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/getValueStartOffset.md)
- [getMaxMatches](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/getMaxMatches.md)
- [provideDocumentLinks](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/provideDocumentLinks.md)
- [processHrefAttributes](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processHrefAttributes.md)
- [processConrefAttributes](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConrefAttributes.md)
- [processConkeyrefAttributesWithKeySpace](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConkeyrefAttributesWithKeySpace.md)
- [processKeyrefAttributesWithKeySpace](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processKeyrefAttributesWithKeySpace.md)
- [processXrefAttributes](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes.md)
- [processXrefKeyrefAttributes](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefKeyrefAttributes.md)
- [processLinkAttributes](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes.md)
- [resolveReference](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReference.md)
- [resolveReferenceWithFragment](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReferenceWithFragment.md)
- [createElementNavigationLink](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/createElementNavigationLink.md)
- [resolveDocumentLink](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveDocumentLink.md)
- [getKeySpaceResolver](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/getKeySpaceResolver.md)
- [extractScope](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractScope.md)
- [extractFormat](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractFormat.md)
- [extractLinktext](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractLinktext.md)
- [extractType](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractType.md)
- [extractRev](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractRev.md)
- [buildEnhancedTooltip](../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/buildEnhancedTooltip.md)
- [getGlobalKeySpaceResolver](../../../functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver.md)
- [registerDitaLinkProvider](../../../functions/src/providers/ditaLinkProvider/registerDitaLinkProvider.md)

# Imports

- `vscode`
- `path`
- `../utils/keySpaceResolver`
- `../utils/logger`
- `../utils/configurationManager`

# Member of

- [ditacraft](../../../packages/ditacraft.md)