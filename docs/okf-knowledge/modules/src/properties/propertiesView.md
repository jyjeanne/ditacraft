---
type: TypeScript Module
title: propertiesView
resource: src/properties/propertiesView.ts#L1-L438
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/crypto
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/editor-visualeditorprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/languageclient
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-grammaroptions
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-sharedregistry
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-elementindex
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-opentag
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-parse
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-editor-properties
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-grammar-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-render-html
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-render-labels
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/messages
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [ChainEntry](../../../interfaces/src/properties/propertiesView/ChainEntry.md)
- [Target](../../../interfaces/src/properties/propertiesView/Target.md)
- [Parsed](../../../interfaces/src/properties/propertiesView/Parsed.md)
- [isDitaDocument](../../../functions/src/properties/propertiesView/isDitaDocument.md)
- [PropertiesViewProvider](../../../classes/src/properties/propertiesView/PropertiesViewProvider.md)
- [constructor](../../../functions/src/properties/propertiesView/PropertiesViewProvider/constructor.md)
- [register](../../../functions/src/properties/propertiesView/PropertiesViewProvider/register.md)
- [dispose](../../../functions/src/properties/propertiesView/PropertiesViewProvider/dispose.md)
- [resolveWebviewView](../../../functions/src/properties/propertiesView/PropertiesViewProvider/resolveWebviewView.md)
- [schedule](../../../functions/src/properties/propertiesView/PropertiesViewProvider/schedule.md)
- [currentTarget](../../../functions/src/properties/propertiesView/PropertiesViewProvider/currentTarget.md)
- [visualTarget](../../../functions/src/properties/propertiesView/PropertiesViewProvider/visualTarget.md)
- [parse](../../../functions/src/properties/propertiesView/PropertiesViewProvider/parse.md)
- [textTarget](../../../functions/src/properties/propertiesView/PropertiesViewProvider/textTarget.md)
- [refresh](../../../functions/src/properties/propertiesView/PropertiesViewProvider/refresh.md)
- [schemeValues](../../../functions/src/properties/propertiesView/PropertiesViewProvider/schemeValues.md)
- [post](../../../functions/src/properties/propertiesView/PropertiesViewProvider/post.md)
- [handle](../../../functions/src/properties/propertiesView/PropertiesViewProvider/handle.md)
- [set](../../../functions/src/properties/propertiesView/PropertiesViewProvider/set.md)
- [debugState](../../../functions/src/properties/propertiesView/PropertiesViewProvider/debugState.md)
- [debugAction](../../../functions/src/properties/propertiesView/PropertiesViewProvider/debugAction.md)
- [buildPropertiesHtml](../../../functions/src/properties/propertiesView/buildPropertiesHtml.md)
- [revealPropertiesView](../../../functions/src/properties/propertiesView/revealPropertiesView.md)

# Imports

- `crypto`
- `path`
- `vscode`
- `../editor/visualEditorProvider`
- `../languageClient`
- `../preview/grammarOptions`
- `../preview/sharedRegistry`
- `../shared/cst/elementIndex`
- `../shared/cst/openTag`
- `../shared/cst/parse`
- `../shared/cst/types`
- `../shared/editor/properties`
- `../shared/grammar/types`
- `../shared/render/html`
- `../shared/render/labels`
- `../utils/logger`
- `./messages`

# Member of

- [ditacraft](../../../packages/ditacraft.md)