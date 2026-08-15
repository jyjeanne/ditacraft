---
type: TypeScript Module
title: customRulesValidator
resource: server/src/features/customRulesValidator.ts#L1-L269
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode-languageserver-node
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [CustomRuleDefinition](../../../../interfaces/server/src/features/customRulesValidator/CustomRuleDefinition.md)
- [CustomRulesFile](../../../../interfaces/server/src/features/customRulesValidator/CustomRulesFile.md)
- [CompiledRule](../../../../interfaces/server/src/features/customRulesValidator/CompiledRule.md)
- [isSafeRegex](../../../../functions/server/src/features/customRulesValidator/isSafeRegex.md)
- [loadRules](../../../../functions/server/src/features/customRulesValidator/loadRules.md)
- [detectFileType](../../../../functions/server/src/features/customRulesValidator/detectFileType.md)
- [validateCustomRules](../../../../functions/server/src/features/customRulesValidator/validateCustomRules.md)
- [clearCustomRulesCache](../../../../functions/server/src/features/customRulesValidator/clearCustomRulesCache.md)

# Imports

- `fs`
- `path`
- `vscode-languageserver/node`
- `../utils/textUtils`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)