---
type: TypeScript Module
title: keySpaceResolver
resource: src/utils/keySpaceResolver.ts#L1-L1549
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
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/constants
    resolved_by: tree-sitter
    confidence: exact
  - target: external/configurationmanager
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [KeyDefinition](../../../interfaces/src/utils/keySpaceResolver/KeyDefinition.md)
- [KeyMetadata](../../../interfaces/src/utils/keySpaceResolver/KeyMetadata.md)
- [KeySpace](../../../interfaces/src/utils/keySpaceResolver/KeySpace.md)
- [CacheConfig](../../../interfaces/src/utils/keySpaceResolver/CacheConfig.md)
- [KeySpaceResolver](../../../classes/src/utils/keySpaceResolver/KeySpaceResolver.md)
- [constructor](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/constructor.md)
- [setupPeriodicCleanup](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/setupPeriodicCleanup.md)
- [loadCacheConfig](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/loadCacheConfig.md)
- [reloadCacheConfig](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/reloadCacheConfig.md)
- [getMaxMatches](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/getMaxMatches.md)
- [normalizePathForComparison](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison.md)
- [isPathWithinWorkspace](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/isPathWithinWorkspace.md)
- [setupFileWatcher](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/setupFileWatcher.md)
- [queueInvalidation](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/queueInvalidation.md)
- [invalidateCacheForFile](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/invalidateCacheForFile.md)
- [buildKeySpace](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/buildKeySpace.md)
- [doBuildKeySpace](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace.md)
- [cacheKeySpace](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/cacheKeySpace.md)
- [cleanupExpiredCacheEntries](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/cleanupExpiredCacheEntries.md)
- [cleanupExpiredRootMapCache](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/cleanupExpiredRootMapCache.md)
- [extractKeyDefinitions](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractKeyDefinitions.md)
- [extractInlineContent](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractInlineContent.md)
- [extractMapReferences](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractMapReferences.md)
- [extractRootKeyscope](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractRootKeyscope.md)
- [combineScopePrefixes](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/combineScopePrefixes.md)
- [addScopedKeyEntry](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/addScopedKeyEntry.md)
- [registerInlineMaprefKeys](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/registerInlineMaprefKeys.md)
- [extractTopicReferences](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractTopicReferences.md)
- [findInnerContent](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/findInnerContent.md)
- [maskRanges](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/maskRanges.md)
- [extractInlineScopeBlocks](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractInlineScopeBlocks.md)
- [processInlineScopeBlocks](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/processInlineScopeBlocks.md)
- [resolveKey](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/resolveKey.md)
- [findRootMap](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/findRootMap.md)
- [fileExistsAsync](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/fileExistsAsync.md)
- [readFileAsync](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/readFileAsync.md)
- [getCacheStats](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/getCacheStats.md)
- [clearCache](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/clearCache.md)
- [followKeyrefChain](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/followKeyrefChain.md)
- [dispose](../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/dispose.md)

# Imports

- `vscode`
- `path`
- `fs`
- `./logger`
- `./constants`
- `./configurationManager`

# Member of

- [ditacraft](../../../packages/ditacraft.md)