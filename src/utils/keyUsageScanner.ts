/**
 * Key Usage Scanner
 * Scans workspace DITA files for keyref and conkeyref attribute usages.
 */

import * as vscode from 'vscode';

const MAX_FILES = 500;

const KEYREF_PATTERN = /\b(?:keyref|conkeyref)\s*=\s*["']([^"']+)["']/g;
const COMMENT_REGEX = /<!--[\s\S]*?-->/g;

export interface KeyUsage {
    uri: vscode.Uri;
    range: vscode.Range;
    keyName: string;
    type: 'keyref' | 'conkeyref';
}

/**
 * Convert a byte offset in text to a line/character Position.
 * Handles both \n and \r\n line endings.
 */
function offsetToPosition(text: string, offset: number): vscode.Position {
    let line = 0;
    let character = 0;
    for (let i = 0; i < offset && i < text.length; i++) {
        if (text[i] === '\n') {
            line++;
            character = 0;
        } else if (text[i] === '\r') {
            // Skip \r — it doesn't count as a character in VS Code positions
        } else {
            character++;
        }
    }
    return new vscode.Position(line, character);
}

/**
 * Scan all DITA files in the workspace for keyref/conkeyref usages.
 * Returns a map from key name to list of usages.
 */
export async function scanKeyUsages(): Promise<Map<string, KeyUsage[]>> {
    const usages = new Map<string, KeyUsage[]>();

    const uris = await vscode.workspace.findFiles(
        '**/*.{dita,ditamap,bookmap}',
        '{**/node_modules/**,**/.vscode-test/**,**/out/**,**/.git/**}',
        MAX_FILES
    );

    for (const uri of uris) {
        try {
            // Prefer in-memory content for open documents, read from disk otherwise
            let text: string;
            const openDoc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === uri.fsPath);
            if (openDoc) {
                text = openDoc.getText();
            } else {
                const bytes = await vscode.workspace.fs.readFile(uri);
                text = Buffer.from(bytes).toString('utf-8');
            }

            // Blank out comments (preserve offsets so Range positions remain correct)
            text = text.replace(COMMENT_REGEX, m => ' '.repeat(m.length));

            const regex = new RegExp(KEYREF_PATTERN.source, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                const attrStart = match.index;
                const isConkeyref = text.substring(attrStart, attrStart + 10).startsWith('conkeyref');
                const type: KeyUsage['type'] = isConkeyref ? 'conkeyref' : 'keyref';

                // Extract the key name (before / for conkeyref)
                let keyName = match[1];
                const slashIndex = keyName.indexOf('/');
                if (slashIndex > 0) {
                    keyName = keyName.substring(0, slashIndex);
                }

                // Calculate the range of the attribute value
                const valueStart = match.index + match[0].indexOf(match[1]);
                const startPos = offsetToPosition(text, valueStart);
                const endPos = offsetToPosition(text, valueStart + match[1].length);

                const usage: KeyUsage = {
                    uri,
                    range: new vscode.Range(startPos, endPos),
                    keyName,
                    type
                };

                const list = usages.get(keyName);
                if (list) {
                    list.push(usage);
                } else {
                    usages.set(keyName, [usage]);
                }
            }
        } catch {
            // Skip files that can't be read
        }
    }

    return usages;
}
