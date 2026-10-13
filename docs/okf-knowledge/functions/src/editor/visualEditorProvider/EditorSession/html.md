---
type: TypeScript Method
title: html
resource: src/editor/visualEditorProvider.ts#L459-L478
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/pageHtml/buildPageHtml
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private html(): string`

# Calls

- [buildPageHtml](../../../../../functions/src/preview/pageHtml/buildPageHtml.md)

# Called by

- [constructor](../../../../../functions/src/editor/visualEditorProvider/EditorSession/constructor.md)