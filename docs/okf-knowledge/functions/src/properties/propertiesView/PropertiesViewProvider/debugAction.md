---
type: TypeScript Method
title: debugAction
resource: src/properties/propertiesView.ts#L401-L412
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public static async debugAction(action: { type: 'refresh' } | { type: 'set'; index: number; element: string; name: string; value: string | null }) : Promise<string | undefined>`

# Called by

- [registerCommands](../../../../../functions/src/extension/registerCommands.md)