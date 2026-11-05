/**
 * Unit tests for MapChangeTracker (mcp/src/mapChangeTracker.ts).
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { MapChangeTracker } from '../src/mapChangeTracker';

suite('MapChangeTracker', () => {

    let workspace: string;

    setup(() => {
        workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-mcp-maps-'));
    });

    teardown(() => {
        fs.rmSync(workspace, { recursive: true, force: true });
    });

    const write = (relative: string, content: string) => {
        const file = path.join(workspace, relative);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content);
        return file;
    };

    test('reports nothing when nothing changed', () => {
        write('root.ditamap', '<map/>');
        const tracker = new MapChangeTracker(workspace);
        assert.deepStrictEqual(tracker.detectChanges(), []);
    });

    test('reports an edited map once', () => {
        const map = write('root.ditamap', '<map/>');
        const tracker = new MapChangeTracker(workspace);
        write('root.ditamap', '<map><keydef keys="k"/></map>');
        assert.deepStrictEqual(tracker.detectChanges(), [{ file: map, pathChanged: false }]);
        assert.deepStrictEqual(tracker.detectChanges(), [], 'a change is reported once');
    });

    test('reports added and removed maps as path changes', () => {
        const removed = write('old.ditamap', '<map/>');
        const tracker = new MapChangeTracker(workspace);
        const added = write('sub/new.bookmap', '<bookmap/>');
        fs.rmSync(removed);
        const changes = tracker.detectChanges();
        assert.strictEqual(changes.length, 2);
        assert.ok(changes.some((c) => c.file === added && c.pathChanged));
        assert.ok(changes.some((c) => c.file === removed && c.pathChanged));
    });

    test('ignores topics', () => {
        const tracker = new MapChangeTracker(workspace);
        write('topic.dita', '<topic/>');
        assert.deepStrictEqual(tracker.detectChanges(), []);
    });
});
