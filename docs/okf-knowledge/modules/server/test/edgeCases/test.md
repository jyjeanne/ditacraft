---
type: TypeScript Module
title: test
resource: server/test/edgeCases.test.ts#L1-L330
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/assert
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-features-validation
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-services-validationpipeline
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-services-catalogvalidationservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-services-rngvalidationservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-services-subjectschemeservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-settings
    resolved_by: tree-sitter
    confidence: exact
  - target: external/helper
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [makeCatalogService](../../../../functions/server/test/edgeCases/test/makeCatalogService.md)
- [makeRngService](../../../../functions/server/test/edgeCases/test/makeRngService.md)
- [makeSubjectSchemeService](../../../../functions/server/test/edgeCases/test/makeSubjectSchemeService.md)
- [validate](../../../../functions/server/test/edgeCases/test/validate.md)

# Imports

- `assert`
- `../src/features/validation`
- `../src/services/validationPipeline`
- `../src/services/catalogValidationService`
- `../src/services/rngValidationService`
- `../src/services/subjectSchemeService`
- `../src/settings`
- `./helper`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)