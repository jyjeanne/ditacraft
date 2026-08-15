---
type: TypeScript Method
title: _buildTree
resource: src/providers/keySpaceViewProvider.ts#L130-L262
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/mapHierarchyParser/findAllMapsInWorkspace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keyUsageScanner/scanKeyUsages
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/getChildren
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _buildTree(): Promise<KeySpaceItem[]>`

# Calls

- [getGlobalKeySpaceResolver](../../../../../functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver.md)
- [findAllMapsInWorkspace](../../../../../functions/src/utils/mapHierarchyParser/findAllMapsInWorkspace.md)
- [scanKeyUsages](../../../../../functions/src/utils/keyUsageScanner/scanKeyUsages.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [getChildren](../../../../../functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/getChildren.md)