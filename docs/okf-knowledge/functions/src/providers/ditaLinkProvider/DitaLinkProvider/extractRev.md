---
type: TypeScript Method
title: extractRev
resource: src/providers/ditaLinkProvider.ts#L839-L842
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/buildEnhancedTooltip
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractRev(elementTag: string): string | undefined`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [buildEnhancedTooltip](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/buildEnhancedTooltip.md)