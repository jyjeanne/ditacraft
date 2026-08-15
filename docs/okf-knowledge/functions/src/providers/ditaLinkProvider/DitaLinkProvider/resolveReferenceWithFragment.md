---
type: TypeScript Method
title: resolveReferenceWithFragment
resource: src/providers/ditaLinkProvider.ts#L722-L763
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/test/suite/keySpaceResolver/test/normalize
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReference
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private resolveReferenceWithFragment(reference: string, baseDir: string): { filePath: string; fragment?: string } | null`

# Calls

- [normalize](../../../../../functions/src/test/suite/keySpaceResolver/test/normalize.md)

# Called by

- [processConrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processConrefAttributes.md)
- [processXrefAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processXrefAttributes.md)
- [processLinkAttributes](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/processLinkAttributes.md)
- [resolveReference](../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/resolveReference.md)