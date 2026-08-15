---
type: TypeScript Function
title: validateAgainstSubjectScheme
resource: server/src/features/batchMetadata.ts#L127-L146
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/batchMetadata/processFile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateAgainstSubjectScheme( subjectSchemeService: SubjectSchemeQueries, attribute: string, elementName: string, value: string ): string | undefined`

# Called by

- [processFile](../../../../../functions/server/src/features/batchMetadata/processFile.md)