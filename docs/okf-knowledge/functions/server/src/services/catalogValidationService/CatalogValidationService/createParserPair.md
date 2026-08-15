---
type: TypeScript Method
title: createParserPair
resource: server/src/services/catalogValidationService.ts#L165-L170
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/catalogValidationService/CatalogValidationService/createParser
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/catalogValidationService/CatalogValidationService/initialize
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private createParserPair(): { parser: TypesXMLSAXParser; handler: TypesXMLDOMBuilder }`

# Calls

- [createParser](../../../../../../functions/server/src/services/catalogValidationService/CatalogValidationService/createParser.md)

# Called by

- [initialize](../../../../../../functions/server/src/services/catalogValidationService/CatalogValidationService/initialize.md)