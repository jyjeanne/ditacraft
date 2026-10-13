---
type: TypeScript Module
title: grammarCache
resource: src/shared/grammar/grammarCache.ts#L1-L108
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/crypto
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/catalogshells
    resolved_by: tree-sitter
    confidence: exact
  - target: external/compiler
    resolved_by: tree-sitter
    confidence: exact
  - target: external/typesxmladapter
    resolved_by: tree-sitter
    confidence: exact
  - target: external/types
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [Dependency](../../../../interfaces/src/shared/grammar/grammarCache/Dependency.md)
- [CacheEntry](../../../../interfaces/src/shared/grammar/grammarCache/CacheEntry.md)
- [CompileRequest](../../../../interfaces/src/shared/grammar/grammarCache/CompileRequest.md)
- [CompileOutcome](../../../../interfaces/src/shared/grammar/grammarCache/CompileOutcome.md)
- [cacheFileFor](../../../../functions/src/shared/grammar/grammarCache/cacheFileFor.md)
- [statDependency](../../../../functions/src/shared/grammar/grammarCache/statDependency.md)
- [isFresh](../../../../functions/src/shared/grammar/grammarCache/isFresh.md)
- [compileWithCache](../../../../functions/src/shared/grammar/grammarCache/compileWithCache.md)

# Imports

- `crypto`
- `fs`
- `path`
- `./catalogShells`
- `./compiler`
- `./typesxmlAdapter`
- `./types`

# Member of

- [ditacraft](../../../../packages/ditacraft.md)