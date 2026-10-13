---
type: TypeScript Module
title: resolver
resource: src/preview/resolver.ts#L1-L653
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/url
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
  - target: external/shared-render-html
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-render-types
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [KeyDefinitionLike](../../../interfaces/src/preview/resolver/KeyDefinitionLike.md)
- [KeyLookup](../../../interfaces/src/preview/resolver/KeyLookup.md)
- [FileSource](../../../interfaces/src/preview/resolver/FileSource.md)
- [ResolverOptions](../../../interfaces/src/preview/resolver/ResolverOptions.md)
- [ResolveOutcome](../../../interfaces/src/preview/resolver/ResolveOutcome.md)
- [Request](../../../interfaces/src/preview/resolver/Request.md)
- [Pass](../../../interfaces/src/preview/resolver/Pass.md)
- [ReferenceResolver](../../../classes/src/preview/resolver/ReferenceResolver.md)
- [constructor](../../../functions/src/preview/resolver/ReferenceResolver/constructor.md)
- [tokens](../../../functions/src/preview/resolver/ReferenceResolver/tokens.md)
- [collect](../../../functions/src/preview/resolver/ReferenceResolver/collect.md)
- [resolve](../../../functions/src/preview/resolver/ReferenceResolver/resolve.md)
- [resolveReuseOf](../../../functions/src/preview/resolver/ReferenceResolver/resolveReuseOf.md)
- [resolveMapReference](../../../functions/src/preview/resolver/ReferenceResolver/resolveMapReference.md)
- [titleOfFile](../../../functions/src/preview/resolver/ReferenceResolver/titleOfFile.md)
- [mapTitle](../../../functions/src/preview/resolver/ReferenceResolver/mapTitle.md)
- [titleChild](../../../functions/src/preview/resolver/ReferenceResolver/titleChild.md)
- [invalidate](../../../functions/src/preview/resolver/ReferenceResolver/invalidate.md)
- [resolveIn](../../../functions/src/preview/resolver/ReferenceResolver/resolveIn.md)
- [resolveOne](../../../functions/src/preview/resolver/ReferenceResolver/resolveOne.md)
- [resolveReuse](../../../functions/src/preview/resolver/ReferenceResolver/resolveReuse.md)
- [resolveKeyref](../../../functions/src/preview/resolver/ReferenceResolver/resolveKeyref.md)
- [glossaryText](../../../functions/src/preview/resolver/ReferenceResolver/glossaryText.md)
- [resolveHref](../../../functions/src/preview/resolver/ReferenceResolver/resolveHref.md)
- [resolveForeign](../../../functions/src/preview/resolver/ReferenceResolver/resolveForeign.md)
- [resolveCode](../../../functions/src/preview/resolver/ReferenceResolver/resolveCode.md)
- [targetPath](../../../functions/src/preview/resolver/ReferenceResolver/targetPath.md)
- [load](../../../functions/src/preview/resolver/ReferenceResolver/load.md)
- [plainText](../../../functions/src/preview/resolver/ReferenceResolver/plainText.md)
- [titleText](../../../functions/src/preview/resolver/ReferenceResolver/titleText.md)
- [isMapFile](../../../functions/src/preview/resolver/isMapFile.md)
- [isAncestor](../../../functions/src/preview/resolver/isAncestor.md)
- [isEmpty](../../../functions/src/preview/resolver/isEmpty.md)
- [decode](../../../functions/src/preview/resolver/decode.md)
- [splitOnce](../../../functions/src/preview/resolver/splitOnce.md)
- [ParsedReference](../../../interfaces/src/preview/resolver/ParsedReference.md)
- [parseReference](../../../functions/src/preview/resolver/parseReference.md)
- [resolvePath](../../../functions/src/preview/resolver/resolvePath.md)
- [findTarget](../../../functions/src/preview/resolver/findTarget.md)
- [siblingRange](../../../functions/src/preview/resolver/siblingRange.md)
- [selectLines](../../../functions/src/preview/resolver/selectLines.md)

# Imports

- `path`
- `url`
- `../shared/cst/parse`
- `../shared/cst/query`
- `../shared/cst/types`
- `../shared/grammar/classTokens`
- `../shared/render/html`
- `../shared/render/types`

# Member of

- [ditacraft](../../../packages/ditacraft.md)