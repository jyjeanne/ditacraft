---
type: TypeScript Function
title: normalize
resource: src/test/suite/keySpaceResolver.test.ts#L556-L559
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/workspace/resolvePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/validateWithinWorkspace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/resolveHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/pathsEqual
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReferenceWithFragment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/suite/insertImageCommand/test/stubWorkspaceFolderCoveringFixtures
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/invalidateCacheForFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function normalize(target: KeySpaceResolver, fsPath: string): string`

# Calls

- [normalizePathForComparison](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison.md)

# Called by

- [resolvePath](../../../../../../functions/mcp/src/workspace/resolvePath.md)
- [validateWithinWorkspace](../../../../../../functions/mcp/src/workspace/validateWithinWorkspace.md)
- [resolveHref](../../../../../../functions/server/src/features/contextGraph/resolveHref.md)
- [pathsEqual](../../../../../../functions/src/commands/previewCommand/pathsEqual.md)
- [resolveReferenceWithFragment](../../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReferenceWithFragment.md)
- [_loadCustomCssAsync](../../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync.md)
- [stubWorkspaceFolderCoveringFixtures](../../../../../../functions/src/test/suite/insertImageCommand/test/stubWorkspaceFolderCoveringFixtures.md)
- [normalizePathForComparison](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison.md)
- [invalidateCacheForFile](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/invalidateCacheForFile.md)
- [doBuildKeySpace](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace.md)