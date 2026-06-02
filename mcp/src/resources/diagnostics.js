"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readDiagnosticsResource = readDiagnosticsResource;
const logger_1 = require("../logger");
async function readDiagnosticsResource(params, ctx) {
    const severity = params['severity'] ? params['severity'].split(',') : undefined;
    const limit = params['limit'] ? parseInt(params['limit'], 10) : 100;
    const filePattern = params['filePattern'] || undefined;
    (0, logger_1.log)('debug', `Diagnostics resource query: severity=${severity}, limit=${limit}, filePattern=${filePattern}`);
    const result = ctx.diagnosticsStore.query({ severity, limit, filePattern });
    return {
        totalCount: result.totalCount,
        diagnostics: result.diagnostics,
    };
}
//# sourceMappingURL=diagnostics.js.map