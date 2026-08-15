---
type: TypeScript Module
title: diagnosticsViewProvider
resource: src/providers/diagnosticsViewProvider.ts#L1-L257
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-debounceutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-constants
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [DiagnosticItem](../../../classes/src/providers/diagnosticsViewProvider/DiagnosticItem.md)
- [constructor](../../../functions/src/providers/diagnosticsViewProvider/DiagnosticItem/constructor.md)
- [DiagnosticsViewProvider](../../../classes/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider.md)
- [constructor](../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/constructor.md)
- [setGroupMode](../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/setGroupMode.md)
- [refresh](../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/refresh.md)
- [getTreeItem](../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/getTreeItem.md)
- [getChildren](../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/getChildren.md)
- [_collectDitaDiagnostics](../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/_collectDitaDiagnostics.md)
- [_groupByFile](../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/_groupByFile.md)
- [_groupByType](../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/_groupByType.md)
- [dispose](../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/dispose.md)

# Imports

- `vscode`
- `../utils/debounceUtils`
- `../utils/constants`

# Member of

- [ditacraft](../../../packages/ditacraft.md)