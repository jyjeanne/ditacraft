import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { handleDocumentLinks } from '../src/features/documentLinks';
import { KeySpaceService } from '../src/services/keySpaceService';
import { createDoc, createDocs } from './helper';

function mockKeySpaceService(workspaceFolders: readonly string[]): KeySpaceService {
    return {
        getWorkspaceFolders: () => workspaceFolders,
    } as unknown as KeySpaceService;
}

suite('handleDocumentLinks', () => {
    test('href on topicref resolves to a same-workspace target', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        try {
            const sourceUri = URI.file(path.join(tmpDir, 'root.ditamap')).toString();
            const content = '<map><topicref href="topic.dita"/></map>';
            const doc = createDoc(content, sourceUri);
            const docs = createDocs(doc);
            const keySpaceService = mockKeySpaceService([tmpDir]);

            const links = await handleDocumentLinks({ textDocument: { uri: sourceUri } }, docs, keySpaceService);
            assert.strictEqual(links.length, 1);
            assert.ok(links[0].target?.endsWith('topic.dita'));
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('href escaping the workspace produces no link (regression)', async () => {
        // root.ditamap (inside workspaceRoot/docs) references "../../secret.dita",
        // which escapes workspaceRoot entirely into a sibling directory. Without a
        // workspace-boundary guard this would resolve into a clickable link
        // pointing outside the workspace.
        const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-'));
        const docsDir = path.join(workspaceRoot, 'docs');
        fs.mkdirSync(docsDir);

        try {
            const sourceUri = URI.file(path.join(docsDir, 'root.ditamap')).toString();
            const content = '<map><topicref href="../../secret.dita"/></map>';
            const doc = createDoc(content, sourceUri);
            const docs = createDocs(doc);
            const keySpaceService = mockKeySpaceService([workspaceRoot]);

            const links = await handleDocumentLinks({ textDocument: { uri: sourceUri } }, docs, keySpaceService);
            assert.strictEqual(links.length, 0, 'escaping href must not produce a navigable link');
        } finally {
            fs.rmSync(workspaceRoot, { recursive: true, force: true });
        }
    });

    test('a document opened outside every workspace folder still links to its own siblings (regression)', async () => {
        // The open document lives entirely outside workspaceRoot (e.g. a loose
        // file opened via File > Open while a different project is the active
        // workspace). A same-directory sibling reference must still resolve —
        // there is no workspace boundary to enforce for a document that isn't
        // part of the workspace to begin with.
        const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-ws-'));
        const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-outside-'));

        try {
            const sourceUri = URI.file(path.join(outsideDir, 'loose.ditamap')).toString();
            const content = '<map><topicref href="sibling.dita"/></map>';
            const doc = createDoc(content, sourceUri);
            const docs = createDocs(doc);
            const keySpaceService = mockKeySpaceService([workspaceRoot]);

            const links = await handleDocumentLinks({ textDocument: { uri: sourceUri } }, docs, keySpaceService);
            assert.strictEqual(links.length, 1, 'sibling reference from an out-of-workspace document should resolve');
            assert.ok(links[0].target?.endsWith('sibling.dita'));
        } finally {
            fs.rmSync(workspaceRoot, { recursive: true, force: true });
            fs.rmSync(outsideDir, { recursive: true, force: true });
        }
    });

    test('document not found returns empty', async () => {
        const docs = createDocs();
        const links = await handleDocumentLinks(
            { textDocument: { uri: 'file:///nonexistent.dita' } },
            docs
        );
        assert.strictEqual(links.length, 0);
    });

    test('without a keySpaceService (single-file mode), links still resolve', async () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
        try {
            const sourceUri = URI.file(path.join(tmpDir, 'root.ditamap')).toString();
            const content = '<map><topicref href="topic.dita"/></map>';
            const doc = createDoc(content, sourceUri);
            const docs = createDocs(doc);

            const links = await handleDocumentLinks({ textDocument: { uri: sourceUri } }, docs);
            assert.strictEqual(links.length, 1);
        } finally {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });
});
