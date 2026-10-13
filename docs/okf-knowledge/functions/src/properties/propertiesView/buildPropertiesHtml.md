---
type: TypeScript Function
title: buildPropertiesHtml
resource: src/properties/propertiesView.ts#L415-L433
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/pageHtml/esc
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/resolveWebviewView
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildPropertiesHtml(cspSource: string, scriptUri: string, styleUri: string, lang: string): string`

# Calls

- [esc](../../../../functions/src/preview/pageHtml/esc.md)

# Called by

- [resolveWebviewView](../../../../functions/src/properties/propertiesView/PropertiesViewProvider/resolveWebviewView.md)