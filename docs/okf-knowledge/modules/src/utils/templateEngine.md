---
type: TypeScript Module
title: templateEngine
resource: src/utils/templateEngine.ts#L1-L126
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs-promises
    resolved_by: tree-sitter
    confidence: exact
  - target: external/xmlutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/pathutils
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [TemplateVariables](../../../interfaces/src/utils/templateEngine/TemplateVariables.md)
- [resolveTemplatesDir](../../../functions/src/utils/templateEngine/resolveTemplatesDir.md)
- [substitutePlaceholders](../../../functions/src/utils/templateEngine/substitutePlaceholders.md)
- [loadTemplateRaw](../../../functions/src/utils/templateEngine/loadTemplateRaw.md)
- [renderTemplate](../../../functions/src/utils/templateEngine/renderTemplate.md)

# Imports

- `vscode`
- `path`
- `fs/promises`
- `./xmlUtils`
- `./pathUtils`

# Member of

- [ditacraft](../../../packages/ditacraft.md)