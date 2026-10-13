---
type: TypeScript Method
title: doBuildKeySpace
resource: server/src/services/keySpaceService.ts#L891-L1110
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/registerKeysForAdditionalScope
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/stripReltables
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/isSubjectSchemeMap
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async doBuildKeySpace(absoluteRootPath: string): Promise<KeySpace>`

# Calls

- [basename](../../../../../../functions/src/shared/render/toHtml/basename.md)
- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [registerKeysForAdditionalScope](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/registerKeysForAdditionalScope.md)
- [readFile](../../../../../../functions/webview/editor/readFile.md)
- [stripReltables](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/stripReltables.md)
- [isSubjectSchemeMap](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/isSubjectSchemeMap.md)