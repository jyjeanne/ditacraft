---
type: TypeScript Method
title: getCacheStats
resource: src/utils/keySpaceResolver.ts#L1613-L1632
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public getCacheStats(): { cacheSize: number; maxSize: number; ttlMs: number; entries: Array<{ rootMap: string; keyCount: number; mapCount: number; ageMs: number }>; }`

# Calls

- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)