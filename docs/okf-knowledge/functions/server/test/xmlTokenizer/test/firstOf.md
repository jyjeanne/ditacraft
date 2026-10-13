---
type: TypeScript Function
title: firstOf
resource: server/test/xmlTokenizer.test.ts#L21-L23
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/test/xmlTokenizer/test/allTokens
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function firstOf(input: string, type: TokenType): Token | undefined`

# Calls

- [allTokens](../../../../../functions/server/test/xmlTokenizer/test/allTokens.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)