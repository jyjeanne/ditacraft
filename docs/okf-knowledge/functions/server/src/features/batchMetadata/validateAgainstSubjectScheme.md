---
type: TypeScript Function
title: validateAgainstSubjectScheme
resource: server/src/features/batchMetadata.ts#L127-L146
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/batchMetadata/processFile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateAgainstSubjectScheme( subjectSchemeService: SubjectSchemeQueries, attribute: string, elementName: string, value: string ): string | undefined`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [processFile](../../../../../functions/server/src/features/batchMetadata/processFile.md)