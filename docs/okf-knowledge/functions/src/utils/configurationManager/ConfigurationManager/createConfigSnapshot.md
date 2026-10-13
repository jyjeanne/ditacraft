---
type: TypeScript Method
title: createConfigSnapshot
resource: src/utils/configurationManager.ts#L273-L281
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/configurationManager/ConfigurationManager/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/handleConfigurationChange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/reloadConfiguration
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private createConfigSnapshot(): Map<string, unknown>`

# Calls

- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [constructor](../../../../../functions/src/utils/configurationManager/ConfigurationManager/constructor.md)
- [handleConfigurationChange](../../../../../functions/src/utils/configurationManager/ConfigurationManager/handleConfigurationChange.md)
- [reloadConfiguration](../../../../../functions/src/utils/configurationManager/ConfigurationManager/reloadConfiguration.md)