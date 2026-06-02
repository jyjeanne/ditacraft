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
exports.handleDitaKeySpace = handleDitaKeySpace;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const workspace_1 = require("../workspace");
const logger_1 = require("../logger");
async function handleDitaKeySpace(args, ctx) {
    const { mapUri, includeScopes = true, includeProvenance = false } = args;
    let rootMapPath;
    if (mapUri) {
        const resolved = (0, workspace_1.resolvePath)(mapUri, ctx.workspaceRoot);
        if (!resolved) {
            throw new Error(`Invalid or unsafe path: ${mapUri}`);
        }
        rootMapPath = resolved.replace(/^file:\/\/\/?/, '');
    }
    else {
        // Auto-discover root map
        const discovered = discoverRootMap(ctx.workspaceRoot);
        if (!discovered) {
            return { mapUri: '', totalKeys: 0, keys: [] };
        }
        rootMapPath = discovered;
    }
    (0, logger_1.log)('debug', `Building key space for root map: ${rootMapPath}`);
    const keySpace = await ctx.keySpaceService.buildKeySpace(rootMapPath);
    const allKeys = await ctx.keySpaceService.getAllKeys(rootMapPath);
    const keys = [];
    for (const [keyName, def] of allKeys) {
        let displayName = keyName;
        let scope;
        if (includeScopes && def.scope) {
            displayName = `${def.scope}.${keyName}`;
            scope = def.scope;
        }
        const entry = {
            keyName: displayName,
            navtitle: def.metadata?.navtitle,
            targetUri: def.targetFile ? `file://${def.targetFile.replace(/\\/g, '/')}` : undefined,
            targetFragment: def.elementId,
            scope,
        };
        if (includeProvenance) {
            entry.sourceFile = def.sourceMap ? `file://${def.sourceMap.replace(/\\/g, '/')}` : undefined;
            entry.sourceLine = def.sourceLine;
        }
        keys.push(entry);
    }
    const resultMapUri = mapUri
        ? (0, workspace_1.resolvePath)(mapUri, ctx.workspaceRoot) ?? mapUri
        : `file://${rootMapPath.replace(/\\/g, '/')}`;
    return {
        mapUri: resultMapUri,
        totalKeys: keys.length,
        keys,
    };
}
function discoverRootMap(workspaceRoot) {
    // Heuristic: look for *.ditamap files, prefer ones at the root level
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
    // Prefer maps directly in workspace root
    const rootMaps = candidates.filter((c) => path.dirname(c) === workspaceRoot);
    return rootMaps.length > 0 ? rootMaps[0] : (candidates.length > 0 ? candidates[0] : null);
}
//# sourceMappingURL=ditaKeySpace.js.map