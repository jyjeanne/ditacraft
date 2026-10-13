---
type: TypeScript Function
title: candidateFiles
resource: src/editor/linkPicker.ts#L82-L109
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/fileCreationCommands/getWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/isDirectory
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkPicker/fileTargets
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function candidateFiles(document: vscode.TextDocument): Promise<string[]>`

# Calls

- [getWorkspaceFolder](../../../../functions/src/commands/fileCreationCommands/getWorkspaceFolder.md)
- [isDirectory](../../../../functions/server/src/features/moveTopic/isDirectory.md)
- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [fileTargets](../../../../functions/src/editor/linkPicker/fileTargets.md)