---
type: TypeScript Method
title: resolveReference
resource: src/providers/ditaLinkProvider.ts#L713-L716
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReferenceWithFragment
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processHrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConkeyrefAttributesWithKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processKeyrefAttributesWithKeySpace
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private resolveReference(reference: string, baseDir: string): string | null`

# Calls

- [resolveReferenceWithFragment](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReferenceWithFragment.md)

# Called by

- [processHrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processHrefAttributes.md)
- [processConkeyrefAttributesWithKeySpace](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConkeyrefAttributesWithKeySpace.md)
- [processKeyrefAttributesWithKeySpace](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processKeyrefAttributesWithKeySpace.md)