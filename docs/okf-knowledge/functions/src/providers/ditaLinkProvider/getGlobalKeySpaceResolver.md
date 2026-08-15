---
type: TypeScript Function
title: getGlobalKeySpaceResolver
resource: src/providers/ditaLinkProvider.ts#L900-L905
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/extension/handleConfigurationChange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/registerDitaLinkProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/_buildTree
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getGlobalKeySpaceResolver(): KeySpaceResolver`

# Called by

- [handleConfigurationChange](../../../../functions/src/extension/handleConfigurationChange.md)
- [registerDitaLinkProvider](../../../../functions/src/providers/ditaLinkProvider/registerDitaLinkProvider.md)
- [_buildTree](../../../../functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/_buildTree.md)