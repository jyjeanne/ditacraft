---
type: TypeScript Method
title: doBuildKeySpace
resource: src/utils/keySpaceResolver.ts#L455-L626
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/readFileAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async doBuildKeySpace(absoluteRootPath: string): Promise<KeySpace>`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)
- [readFileAsync](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/readFileAsync.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)