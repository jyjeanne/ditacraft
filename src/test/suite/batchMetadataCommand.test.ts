/**
 * Batch Metadata Update Command Test Suite
 * Tests the pure selection-reduction/label-building/summary helpers
 * directly, plus command registration. Full orchestration (sendRequest to
 * a real LSP server, VS Code's own refactor-preview UI) isn't exercised
 * here — see server/test/batchMetadata.test.ts for the request handler's
 * own coverage, which is where the actual attribute set/remove logic lives.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import {
    resolveSelectedFileItems,
    describeBatchLabel,
    summarizeSkipped,
} from '../../commands/batchMetadataCommand';
import { DitaExplorerItem } from '../../providers/ditaExplorerProvider';
import { MapNode } from '../../utils/mapHierarchyParser';

function makeItem(overrides: Partial<MapNode> = {}): DitaExplorerItem {
    const node: MapNode = {
        id: overrides.id ?? 'node-1',
        label: overrides.label ?? 'topic.dita',
        type: overrides.type ?? 'topic',
        exists: overrides.exists ?? true,
        children: overrides.children ?? [],
        filePath: overrides.filePath ?? '/workspace/topic.dita',
        ...overrides
    };
    return new DitaExplorerItem(node);
}

suite('Batch Metadata Update Command Test Suite', () => {
    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }
        if (!extension.isActive) {
            await extension.activate();
        }
    });

    suite('Command Registration', () => {
        test('Should have batchUpdateMetadata command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.batchUpdateMetadata'),
                'ditacraft.batchUpdateMetadata command should be registered'
            );
        });
    });

    suite('resolveSelectedFileItems', () => {
        test('Should prefer the full multi-selection when there is one', () => {
            const clicked = makeItem({ id: 'clicked', filePath: '/workspace/a.dita' });
            const selected = [
                makeItem({ id: 'a', filePath: '/workspace/a.dita' }),
                makeItem({ id: 'b', filePath: '/workspace/b.dita' })
            ];

            const result = resolveSelectedFileItems(clicked, selected);
            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].mapNode.id, 'a');
            assert.strictEqual(result[1].mapNode.id, 'b');
        });

        test('Should fall back to just the clicked item when there is no multi-selection', () => {
            const clicked = makeItem({ id: 'clicked', filePath: '/workspace/a.dita' });
            const result = resolveSelectedFileItems(clicked, undefined);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].mapNode.id, 'clicked');
        });

        test('Should fall back to just the clicked item when allSelected is empty', () => {
            const clicked = makeItem({ id: 'clicked', filePath: '/workspace/a.dita' });
            const result = resolveSelectedFileItems(clicked, []);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].mapNode.id, 'clicked');
        });

        test('Should return an empty array when nothing is passed', () => {
            assert.deepStrictEqual(resolveSelectedFileItems(undefined, undefined), []);
        });

        test('Should filter out non-file nodes (no filePath, e.g. a keydef)', () => {
            const keydef = makeItem({ id: 'keydef', type: 'keydef', filePath: undefined });
            const file = makeItem({ id: 'file', filePath: '/workspace/a.dita' });
            const result = resolveSelectedFileItems(undefined, [keydef, file]);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].mapNode.id, 'file');
        });

        test('Should filter out files the tree already knows are missing on disk', () => {
            const missing = makeItem({ id: 'missing', filePath: '/workspace/gone.dita', exists: false });
            const present = makeItem({ id: 'present', filePath: '/workspace/a.dita', exists: true });
            const result = resolveSelectedFileItems(undefined, [missing, present]);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].mapNode.id, 'present');
        });
    });

    suite('describeBatchLabel', () => {
        test('Should describe a "Set" action with a value, pluralizing "files" correctly', () => {
            assert.strictEqual(
                describeBatchLabel('audience', 'internal', 3),
                'Batch Metadata: Set @audience="internal" (3 files)'
            );
            assert.strictEqual(
                describeBatchLabel('audience', 'internal', 1),
                'Batch Metadata: Set @audience="internal" (1 file)'
            );
        });

        test('Should describe a "Remove" action for an empty value', () => {
            assert.strictEqual(
                describeBatchLabel('audience', '', 2),
                'Batch Metadata: Remove @audience (2 files)'
            );
        });
    });

    suite('summarizeSkipped', () => {
        test('Should list all names when there are 3 or fewer', () => {
            const skipped = [
                { uri: 'file:///workspace/a.dita', reason: 'no root element' },
                { uri: 'file:///workspace/b.dita', reason: 'unreadable' }
            ];
            assert.strictEqual(summarizeSkipped(skipped), 'Skipped: a.dita, b.dita.');
        });

        test('Should truncate with "and N more" beyond 3 names', () => {
            const skipped = [
                { uri: 'file:///workspace/a.dita', reason: 'x' },
                { uri: 'file:///workspace/b.dita', reason: 'x' },
                { uri: 'file:///workspace/c.dita', reason: 'x' },
                { uri: 'file:///workspace/d.dita', reason: 'x' },
                { uri: 'file:///workspace/e.dita', reason: 'x' }
            ];
            assert.strictEqual(summarizeSkipped(skipped), 'Skipped: a.dita, b.dita, c.dita and 2 more.');
        });

        test('Should handle an empty list', () => {
            assert.strictEqual(summarizeSkipped([]), 'Skipped: .');
        });
    });
});
