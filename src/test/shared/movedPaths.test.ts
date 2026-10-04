/**
 * Where a path is after files or folders moved (src/utils/movedPaths.ts).
 */

import * as assert from 'assert';
import * as path from 'path';
import { movedPath, pathSettingValue, resolvePathSetting } from '../../utils/movedPaths';

suite('movedPath', () => {
    const root = path.join(path.sep, 'w');
    const p = (...parts: string[]) => path.join(root, ...parts);

    test('a renamed file, a file in a moved folder, the folder itself', () => {
        const moves = [
            { oldPath: p('filters', 'web.ditaval'), newPath: p('filters', 'online.ditaval') },
            { oldPath: p('profiles'), newPath: p('config', 'profiles') },
        ];
        assert.strictEqual(movedPath(p('filters', 'web.ditaval'), moves), p('filters', 'online.ditaval'));
        assert.strictEqual(movedPath(p('profiles', 'print', 'pdf.ditaval'), moves), p('config', 'profiles', 'print', 'pdf.ditaval'));
        assert.strictEqual(movedPath(p('profiles'), moves), p('config', 'profiles'));
    });

    test('anything else did not move', () => {
        const moves = [{ oldPath: p('filters'), newPath: p('other') }];
        assert.strictEqual(movedPath(p('filters-old', 'a.ditaval'), moves), undefined, 'a sibling whose name starts the same');
        assert.strictEqual(movedPath(p('a.ditaval'), moves), undefined);
        assert.strictEqual(movedPath(p('a.ditaval'), []), undefined);
    });
});

suite('path settings', () => {
    const folder = path.join(path.sep, 'w');
    const p = (...parts: string[]) => path.join(folder, ...parts);

    test('resolvePathSetting: ${workspaceFolder}, relative, absolute, empty', () => {
        assert.strictEqual(resolvePathSetting('${workspaceFolder}/maps/guide.ditamap', folder), p('maps', 'guide.ditamap'));
        assert.strictEqual(resolvePathSetting('maps/guide.ditamap', folder), p('maps', 'guide.ditamap'));
        assert.strictEqual(resolvePathSetting(p('rules.json'), folder), p('rules.json'));
        assert.strictEqual(resolvePathSetting('', folder), undefined);
        assert.strictEqual(resolvePathSetting('maps/guide.ditamap', undefined), undefined, 'relative with no workspace folder');
    });

    test('pathSettingValue: the new path written the way the value was', () => {
        const moved = p('content', 'guide.ditamap');
        assert.strictEqual(pathSettingValue('maps/guide.ditamap', moved, folder), 'content/guide.ditamap', 'relative, with /');
        assert.strictEqual(pathSettingValue('${workspaceFolder}/maps/guide.ditamap', moved, folder), '${workspaceFolder}/content/guide.ditamap');
        assert.strictEqual(pathSettingValue(p('maps', 'guide.ditamap'), moved, folder), moved, 'absolute stays absolute');
        const outside = path.join(path.sep, 'elsewhere', 'guide.ditamap');
        assert.strictEqual(pathSettingValue('maps/guide.ditamap', outside, folder), outside, 'out of the workspace folder: absolute');
    });
});
