"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.readMapsResource = readMapsResource;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../logger");
async function readMapsResource(ctx) {
    const maps = [];
    const scanDir = (dir, depth) => {
        if (depth > 5)
            return;
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                scanDir(fullPath, depth + 1);
            }
            else if (entry.isFile() && (entry.name.endsWith('.ditamap') || entry.name.endsWith('.bookmap'))) {
                try {
                    const stat = fs.statSync(fullPath);
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i);
                    const title = titleMatch ? titleMatch[1].trim() : path.basename(fullPath);
                    const topicrefCount = (content.match(/<topicref\b/gi) || []).length;
                    maps.push({
                        uri: `file://${fullPath.replace(/\\/g, '/')}`,
                        title,
                        topicCount: topicrefCount,
                        isRoot: path.dirname(fullPath) === ctx.workspaceRoot,
                        lastModified: stat.mtime.toISOString(),
                    });
                }
                catch {
                    // Skip unreadable files
                }
            }
        }
    };
    scanDir(ctx.workspaceRoot, 0);
    (0, logger_1.log)('debug', `Workspace maps resource: found ${maps.length} maps`);
    return { maps };
}
//# sourceMappingURL=maps.js.map