/**
 * The one grammar registry of the extension, shared by the visual preview and the visual
 * editor (grammars are loaded and compiled once per session).
 */

import * as path from 'path';
import type * as vscode from 'vscode';
import { logger } from '../utils/logger';
import { GrammarRegistry } from './grammarRegistry';

let registry: GrammarRegistry | undefined;

export function sharedGrammarRegistry(context: vscode.ExtensionContext): GrammarRegistry {
    if (!registry) {
        registry = new GrammarRegistry(
            context.extensionPath,
            path.join(context.globalStorageUri.fsPath, 'grammars'),
            (message) => logger.warn(message),
        );
    }
    return registry;
}
