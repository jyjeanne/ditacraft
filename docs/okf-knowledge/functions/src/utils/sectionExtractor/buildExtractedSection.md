---
type: TypeScript Function
title: buildExtractedSection
resource: src/utils/sectionExtractor.ts#L103-L131
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/utils/sectionExtractor/findEnclosingSection
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildExtractedSection( originalText: string, tagStart: number, end: number, contentStart: number, attrsText: string ): ExtractedSection`

# Called by

- [findEnclosingSection](../../../../functions/src/utils/sectionExtractor/findEnclosingSection.md)