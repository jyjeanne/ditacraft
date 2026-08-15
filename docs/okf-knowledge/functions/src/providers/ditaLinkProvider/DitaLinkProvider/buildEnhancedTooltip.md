---
type: TypeScript Method
title: buildEnhancedTooltip
resource: src/providers/ditaLinkProvider.ts#L847-L891
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractScope
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractFormat
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractRev
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractLinktext
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private buildEnhancedTooltip( baseTooltip: string, elementTag: string, options: { showScope?: boolean; showFormat?: boolean; showLinktext?: boolean; showType?: boolean; showRev?: boolean } = {} ): string`

# Calls

- [extractScope](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractScope.md)
- [extractFormat](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractFormat.md)
- [extractType](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractType.md)
- [extractRev](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractRev.md)
- [extractLinktext](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractLinktext.md)

# Called by

- [processXrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes.md)
- [processLinkAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes.md)