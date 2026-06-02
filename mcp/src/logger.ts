const levels = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof levels;

let currentLevel: Level = 'warn';

export function setLevel(level: Level): void {
    currentLevel = level;
}

export function log(level: Level, message: string): void {
    if (levels[level] >= levels[currentLevel]) {
        const ts = new Date().toISOString();
        process.stderr.write(`[${ts}] [ditacraft-mcp] [${level.toUpperCase()}] ${message}\n`);
    }
}
