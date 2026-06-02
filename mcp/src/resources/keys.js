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
exports.readKeysResource = readKeysResource;
const logger_1 = require("../logger");
async function readKeysResource(params, ctx) {
    const includeScopes = params['includeScopes'] !== 'false';
    const search = params['search'] || undefined;
    (0, logger_1.log)('debug', `Keys resource query: includeScopes=${includeScopes}, search=${search}`);
    // Auto-discover root map
    const rootMapPath = await discoverRootMap(ctx.workspaceRoot);
    if (!rootMapPath) {
        return { totalKeys: 0, keys: [] };
    }
    const allKeys = await ctx.keySpaceService.getAllKeys(rootMapPath);
    const keys = [];
    for (const [keyName, def] of allKeys) {
        let displayName = keyName;
        if (includeScopes && def.scope) {
            displayName = `${def.scope}.${keyName}`;
        }
        if (search && !displayName.toLowerCase().includes(search.toLowerCase())) {
            continue;
        }
        keys.push({
            keyName: displayName,
            navtitle: def.metadata?.navtitle,
            targetUri: def.targetFile ? `file://${def.targetFile.replace(/\\/g, '/')}` : undefined,
            targetFragment: def.elementId,
        });
    }
    return {
        totalKeys: keys.length,
        keys,
    };
}
async function discoverRootMap(workspaceRoot) {
    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
    const path = await Promise.resolve().then(() => __importStar(require('path')));
    const candidates = [];
    const scanDir = (dir, depth) => {
        if (depth > 3)
            return;
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                scanDir(path.join(dir, entry.name), depth + 1);
            }
            else if (entry.isFile() && entry.name.endsWith('.ditamap')) {
                candidates.push(path.join(dir, entry.name));
            }
        }
    };
    scanDir(workspaceRoot, 0);
    const rootMaps = candidates.filter((c) => path.dirname(c) === workspaceRoot);
    return rootMaps.length > 0 ? rootMaps[0] : (candidates.length > 0 ? candidates[0] : null);
}
//# sourceMappingURL=keys.js.map