import * as path from 'path';
import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
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
 * Stop the DITA Language Server
 */
export async function stopLanguageClient(): Promise<void> {
    if (client) {
        await client.stop();
        client = undefined;
        logger.info('DITA Language Server stopped');
    }
}
