---
type: TypeScript Module
title: keySpaceService
resource: server/src/services/keySpaceService.ts#L1-L2192
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fast-xml-parser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-patterns
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/interfaces
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [KeyDefinition](../../../../interfaces/server/src/services/keySpaceService/KeyDefinition.md)
- [KeyMetadata](../../../../interfaces/server/src/services/keySpaceService/KeyMetadata.md)
- [ResolutionStep](../../../../interfaces/server/src/services/keySpaceService/ResolutionStep.md)
- [KeyResolutionReport](../../../../interfaces/server/src/services/keySpaceService/KeyResolutionReport.md)
- [KeySpace](../../../../interfaces/server/src/services/keySpaceService/KeySpace.md)
- [CacheConfig](../../../../interfaces/server/src/services/keySpaceService/CacheConfig.md)
- [KeySpaceSettings](../../../../interfaces/server/src/services/keySpaceService/KeySpaceSettings.md)
- [KeySpaceService](../../../../classes/server/src/services/keySpaceService/KeySpaceService.md)
- [constructor](../../../../functions/server/src/services/keySpaceService/KeySpaceService/constructor.md)
- [getWorkspaceFolders](../../../../functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders.md)
- [setExplicitRootMap](../../../../functions/server/src/services/keySpaceService/KeySpaceService/setExplicitRootMap.md)
- [invalidateAllCaches](../../../../functions/server/src/services/keySpaceService/KeySpaceService/invalidateAllCaches.md)
- [getExplicitRootMap](../../../../functions/server/src/services/keySpaceService/KeySpaceService/getExplicitRootMap.md)
- [resolveKey](../../../../functions/server/src/services/keySpaceService/KeySpaceService/resolveKey.md)
- [resolveKeyEntry](../../../../functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntry.md)
- [resolveKeyEntryWithScope](../../../../functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntryWithScope.md)
- [explainKey](../../../../functions/server/src/services/keySpaceService/KeySpaceService/explainKey.md)
- [getAllKeys](../../../../functions/server/src/services/keySpaceService/KeySpaceService/getAllKeys.md)
- [getSubjectSchemePaths](../../../../functions/server/src/services/keySpaceService/KeySpaceService/getSubjectSchemePaths.md)
- [getDuplicateKeys](../../../../functions/server/src/services/keySpaceService/KeySpaceService/getDuplicateKeys.md)
- [buildKeySpace](../../../../functions/server/src/services/keySpaceService/KeySpaceService/buildKeySpace.md)
- [isBuildStale](../../../../functions/server/src/services/keySpaceService/KeySpaceService/isBuildStale.md)
- [findRootMap](../../../../functions/server/src/services/keySpaceService/KeySpaceService/findRootMap.md)
- [doFindRootMap](../../../../functions/server/src/services/keySpaceService/KeySpaceService/doFindRootMap.md)
- [invalidateForFile](../../../../functions/server/src/services/keySpaceService/KeySpaceService/invalidateForFile.md)
- [updateWorkspaceFolders](../../../../functions/server/src/services/keySpaceService/KeySpaceService/updateWorkspaceFolders.md)
- [reloadCacheConfig](../../../../functions/server/src/services/keySpaceService/KeySpaceService/reloadCacheConfig.md)
- [shutdown](../../../../functions/server/src/services/keySpaceService/KeySpaceService/shutdown.md)
- [doBuildKeySpace](../../../../functions/server/src/services/keySpaceService/KeySpaceService/doBuildKeySpace.md)
- [parseMapElements](../../../../functions/server/src/services/keySpaceService/KeySpaceService/parseMapElements.md)
- [collectXmlElements](../../../../functions/server/src/services/keySpaceService/KeySpaceService/collectXmlElements.md)
- [extractMetadataFromNode](../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractMetadataFromNode.md)
- [extractKeyDefinitions](../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitions.md)
- [extractKeyDefinitionsFromElements](../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsFromElements.md)
- [extractKeyDefinitionsRegex](../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsRegex.md)
- [extractKeyMetadata](../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyMetadata.md)
- [followKeyrefChain](../../../../functions/server/src/services/keySpaceService/KeySpaceService/followKeyrefChain.md)
- [followKeyrefChainWithTrace](../../../../functions/server/src/services/keySpaceService/KeySpaceService/followKeyrefChainWithTrace.md)
- [appendKeyrefSteps](../../../../functions/server/src/services/keySpaceService/KeySpaceService/appendKeyrefSteps.md)
- [extractTopicReferences](../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractTopicReferences.md)
- [extractMapReferences](../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractMapReferences.md)
- [cacheKeySpace](../../../../functions/server/src/services/keySpaceService/KeySpaceService/cacheKeySpace.md)
- [cleanupExpiredCacheEntries](../../../../functions/server/src/services/keySpaceService/KeySpaceService/cleanupExpiredCacheEntries.md)
- [cleanupExpiredRootMapCache](../../../../functions/server/src/services/keySpaceService/KeySpaceService/cleanupExpiredRootMapCache.md)
- [startPeriodicCleanup](../../../../functions/server/src/services/keySpaceService/KeySpaceService/startPeriodicCleanup.md)
- [doInvalidate](../../../../functions/server/src/services/keySpaceService/KeySpaceService/doInvalidate.md)
- [isPathWithinWorkspace](../../../../functions/server/src/services/keySpaceService/KeySpaceService/isPathWithinWorkspace.md)
- [registerInlineMaprefKeys](../../../../functions/server/src/services/keySpaceService/KeySpaceService/registerInlineMaprefKeys.md)
- [registerKeysForAdditionalScope](../../../../functions/server/src/services/keySpaceService/KeySpaceService/registerKeysForAdditionalScope.md)
- [combineScopePrefixes](../../../../functions/server/src/services/keySpaceService/KeySpaceService/combineScopePrefixes.md)
- [addScopedKeyEntry](../../../../functions/server/src/services/keySpaceService/KeySpaceService/addScopedKeyEntry.md)
- [computeLineNumber](../../../../functions/server/src/services/keySpaceService/KeySpaceService/computeLineNumber.md)
- [extractInlineScopeBlocks](../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractInlineScopeBlocks.md)
- [findInnerContent](../../../../functions/server/src/services/keySpaceService/KeySpaceService/findInnerContent.md)
- [maskRanges](../../../../functions/server/src/services/keySpaceService/KeySpaceService/maskRanges.md)
- [processInlineScopeBlocks](../../../../functions/server/src/services/keySpaceService/KeySpaceService/processInlineScopeBlocks.md)
- [stripReltables](../../../../functions/server/src/services/keySpaceService/KeySpaceService/stripReltables.md)
- [extractRootKeyscope](../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractRootKeyscope.md)
- [isSubjectSchemeMap](../../../../functions/server/src/services/keySpaceService/KeySpaceService/isSubjectSchemeMap.md)
- [fileExistsAsync](../../../../functions/server/src/services/keySpaceService/KeySpaceService/fileExistsAsync.md)
- [reportKeySpace](../../../../functions/server/src/services/keySpaceService/reportKeySpace.md)
- [formatResolutionReport](../../../../functions/server/src/services/keySpaceService/formatResolutionReport.md)

# Imports

- `path`
- `fs`
- `fast-xml-parser`
- `../utils/patterns`
- `../utils/textUtils`
- `./interfaces`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)