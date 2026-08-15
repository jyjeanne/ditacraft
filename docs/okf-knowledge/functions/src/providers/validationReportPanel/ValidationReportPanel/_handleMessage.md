---
type: TypeScript Method
title: _handleMessage
resource: src/providers/validationReportPanel.ts#L121-L181
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtOutputChannel/getDitaOtOutputChannel
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _handleMessage(message: { command: string; path?: string; line?: number; column?: number; text?: string; }): Promise<void>`

# Calls

- [getDitaOtOutputChannel](../../../../../functions/src/utils/ditaOtOutputChannel/getDitaOtOutputChannel.md)