---
type: TypeScript Function
title: keyTargets
resource: src/editor/linkPicker.ts#L126-L143
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function keyTargets(docPath: string, contextRoot?: string): Promise<KeyTarget[]>`

# Calls

- [getGlobalKeySpaceResolver](../../../../functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver.md)

# Called by

- [pickLinkTarget](../../../../functions/src/editor/linkPicker/pickLinkTarget.md)