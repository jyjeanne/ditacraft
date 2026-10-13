---
type: JavaScript Function
title: compileGrammars
resource: scripts/compile-grammars.js#L19-L52
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/build
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/buildGrammars/buildBundledGrammars
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/esbuild/main
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function compileGrammars({ force = false, quiet = false } = {})`

# Calls

- [build](../../../functions/webview/editor/build.md)
- [buildBundledGrammars](../../../functions/src/shared/grammar/buildGrammars/buildBundledGrammars.md)

# Called by

- [main](../../../functions/esbuild/main.md)