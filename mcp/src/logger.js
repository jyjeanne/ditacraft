"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLevel = setLevel;
exports.log = log;
const levels = { debug: 0, info: 1, warn: 2, error: 3 };
let currentLevel = 'warn';
function setLevel(level) {
    currentLevel = level;
}
function log(level, message) {
    if (levels[level] >= levels[currentLevel]) {
        const ts = new Date().toISOString();
        process.stderr.write(`[${ts}] [ditacraft-mcp] [${level.toUpperCase()}] ${message}\n`);
    }
}
//# sourceMappingURL=logger.js.map