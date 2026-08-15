---
type: TypeScript Function
title: promptForCount
resource: src/commands/insertTableCommand.ts#L117-L130
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/insertTableCommand/insertTableCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function promptForCount(title: string, noun: string, min: number, max: number): Promise<number | undefined>`

# Called by

- [insertTableCommand](../../../../functions/src/commands/insertTableCommand/insertTableCommand.md)