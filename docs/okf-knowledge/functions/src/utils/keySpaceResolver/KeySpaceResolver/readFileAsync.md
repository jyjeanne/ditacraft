---
type: TypeScript Method
title: readFileAsync
resource: src/utils/keySpaceResolver.ts#L1606-L1608
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async readFileAsync(filePath: string): Promise<string>`

# Calls

- [readFile](../../../../../functions/webview/editor/readFile.md)

# Called by

- [doBuildKeySpace](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace.md)