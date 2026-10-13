---
type: TypeScript Module
title: mapContexts
resource: src/preview/mapContexts.ts#L1-L301
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-ditalinkprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-parse
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-query
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-grammar-classtokens
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-render-labels
    resolved_by: tree-sitter
    confidence: exact
  - target: external/resolver
    resolved_by: tree-sitter
    confidence: exact
  - target: external/mapcontext
    resolved_by: tree-sitter
    confidence: exact
  - target: external/sharedregistry
    resolved_by: tree-sitter
    confidence: exact
  - target: external/workspacetext
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [TopicContext](../../../interfaces/src/preview/mapContexts/TopicContext.md)
- [MapContexts](../../../classes/src/preview/mapContexts/MapContexts.md)
- [initialize](../../../functions/src/preview/mapContexts/MapContexts/initialize.md)
- [get](../../../functions/src/preview/mapContexts/MapContexts/get.md)
- [constructor](../../../functions/src/preview/mapContexts/MapContexts/constructor.md)
- [dispose](../../../functions/src/preview/mapContexts/MapContexts/dispose.md)
- [loadMaps](../../../functions/src/preview/mapContexts/MapContexts/loadMaps.md)
- [preferredRoot](../../../functions/src/preview/mapContexts/MapContexts/preferredRoot.md)
- [places](../../../functions/src/preview/mapContexts/MapContexts/places.md)
- [stored](../../../functions/src/preview/mapContexts/MapContexts/stored.md)
- [keyOf](../../../functions/src/preview/mapContexts/MapContexts/keyOf.md)
- [contextOf](../../../functions/src/preview/mapContexts/MapContexts/contextOf.md)
- [choose](../../../functions/src/preview/mapContexts/MapContexts/choose.md)
- [chooseFromMapRow](../../../functions/src/preview/mapContexts/MapContexts/chooseFromMapRow.md)
- [pick](../../../functions/src/preview/mapContexts/MapContexts/pick.md)
- [resolveKey](../../../functions/src/preview/mapContexts/MapContexts/resolveKey.md)
- [localMaps](../../../functions/src/preview/mapContexts/localMaps.md)

# Imports

- `fs`
- `path`
- `vscode`
- `../providers/ditaLinkProvider`
- `../shared/cst/parse`
- `../shared/cst/query`
- `../shared/cst/types`
- `../shared/grammar/classTokens`
- `../shared/render/labels`
- `./resolver`
- `./mapContext`
- `./sharedRegistry`
- `./workspaceText`

# Member of

- [ditacraft](../../../packages/ditacraft.md)