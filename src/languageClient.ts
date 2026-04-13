import * as path from 'path';
import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    State,
} from 'vscode-languageclient/node';
import { logger } from './utils/logger';

let client: LanguageClient | undefined;

/**
 * Start the DITA Language Server and connect the client
 */
export async function startLanguageClient(
    context: vscode.ExtensionContext
): Promise<void> {
    const serverModule = context.asAbsolutePath(
        path.join('server', 'out', 'server.js')
    );

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: { execArgv: ['--nolazy', '--inspect=6009'] },
        },
    };

    // Pass initial configuration to the server
    const config = vscode.workspace.getConfiguration('ditacraft');
    const xmlCatalogPath = config.get<string>('xmlCatalogPath', '');

    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { scheme: 'file', language: 'dita' },
        ],
        synchronize: {
            fileEvents: [
                vscode.workspace.createFileSystemWatcher('**/*.dita'),
                vscode.workspace.createFileSystemWatcher('**/*.ditamap'),
                vscode.workspace.createFileSystemWatcher('**/*.bookmap'),
                vscode.workspace.createFileSystemWatcher('**/*.ditaval'),
            ],
        },
        initializationOptions: {
            xmlCatalogPath: xmlCatalogPath || undefined,
        },
        outputChannelName: 'DITA Language Server',
    };

    client = new LanguageClient(
        'ditacraftLsp',
        'DITA Language Server',
        serverOptions,
        clientOptions
    );

    await client.start();
    logger.info('DITA Language Server started');
}

/**
 * Get the active language client instance (for sending commands).
 */
export function getLanguageClient(): LanguageClient | undefined {
    return client;
}

/**
 * Wait until the language client reaches Running state (for test setup).
 * Returns true if ready within `timeout` ms, false if timed out.
 */
export async function waitForLanguageClientReady(timeout = 10000): Promise<boolean> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        if (client && client.state === State.Running) {
            return true;
        }
        await new Promise(r => setTimeout(r, 100));
    }
    return false;
}

/**
 * Stop the DITA Language Server
 */
export async function stopLanguageClient(): Promise<void> {
    if (client) {
        await client.stop();
        client = undefined;
        logger.info('DITA Language Server stopped');
    }
}
