/**
 * DITA Link Provider Test Suite
 * Tests Ctrl+Click navigation for href attributes in DITA maps
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { DitaLinkProvider } from '../../providers/ditaLinkProvider';

suite('DITA Link Provider Test Suite', () => {
    let linkProvider: DitaLinkProvider;
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

    suiteSetup(async () => {
        linkProvider = new DitaLinkProvider();

        // Ensure extension is activated
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    suite('Language ID Configuration', () => {
        test('DITA map files should have "dita" language ID', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'test-map-with-links.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            console.log('Document language ID:', document.languageId);
            console.log('Document file name:', document.fileName);

            assert.strictEqual(document.languageId, 'dita',
                'DITA map files should have language ID "dita" not "xml"');
        });

        test('Bookmap files should have "dita" language ID', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-bookmap.bookmap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            console.log('Bookmap language ID:', document.languageId);

            assert.strictEqual(document.languageId, 'dita',
                'Bookmap files should have language ID "dita" not "xml"');
        });

        test('DITA topic files should have "dita" language ID', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-topic.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            console.log('Topic language ID:', document.languageId);

            assert.strictEqual(document.languageId, 'dita',
                'DITA topic files should have language ID "dita"');
        });
    });

    suite('Link Detection', () => {
        test('Should detect href attributes in topicref elements', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'test-map-with-links.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            assert.ok(links, 'Should return links');
            assert.ok(links!.length > 0, 'Should find at least one link');
        });

        test('Should create links for local DITA files', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'test-map-with-links.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link to valid-topic.dita
            const validTopicLink = links!.find(link =>
                link.target?.fsPath.includes('valid-topic.dita')
            );

            assert.ok(validTopicLink, 'Should find link to valid-topic.dita');
        });

        test('Should handle relative paths correctly', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'test-map-with-links.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // All local file links should have absolute paths
            links!.forEach(link => {
                if (link.target && !link.target.toString().startsWith('http')) {
                    assert.ok(path.isAbsolute(link.target.fsPath),
                        `Link target should be absolute path: ${link.target.fsPath}`);
                }
            });
        });

        test('Should skip external HTTP URLs', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'test-map-with-links.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should not create links for http:// URLs
            const httpLinks = links!.filter(link =>
                link.target?.toString().startsWith('http')
            );

            assert.strictEqual(httpLinks.length, 0, 'Should not create links for HTTP URLs');
        });

        test('Should handle href with fragment identifiers', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'test-map-with-links.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link to valid-topic.dita (without the #topic_id fragment)
            const fragmentLink = links!.find(link =>
                link.target?.fsPath.includes('valid-topic.dita')
            );

            assert.ok(fragmentLink, 'Should handle href with fragment identifier');
            // Fragment should be stripped from the path
            assert.ok(!fragmentLink!.target?.fsPath.includes('#'), 'Fragment should be removed from path');
        });

        test('Should handle nested topicref elements', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'test-map-with-links.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link to no-doctype.dita (nested topicref)
            const nestedLink = links!.find(link =>
                link.target?.fsPath.includes('no-doctype.dita')
            );

            assert.ok(nestedLink, 'Should find links in nested topicref elements');
        });
    });

    suite('Link Range', () => {
        test('Should have correct range for href value', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'test-map-with-links.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            links!.forEach(link => {
                const text = document.getText(link.range);
                // The range should contain the href value (filename)
                assert.ok(text.length > 0, 'Link range should not be empty');
                assert.ok(!text.includes('href='), 'Link range should not include "href=" attribute name');
                assert.ok(!text.includes('"'), 'Link range should not include quotes');
            });
        });

        test('Should have valid position in document', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'test-map-with-links.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            links!.forEach(link => {
                assert.ok(link.range.start.line >= 0, 'Start line should be >= 0');
                assert.ok(link.range.start.character >= 0, 'Start character should be >= 0');
                assert.ok(link.range.end.line >= link.range.start.line, 'End line should be >= start line');
                assert.ok(link.range.end.character > link.range.start.character ||
                         link.range.end.line > link.range.start.line,
                    'End position should be after start position');
            });
        });
    });

    suite('Link Tooltip', () => {
        test('Should have tooltip with filename', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'test-map-with-links.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            links!.forEach(link => {
                assert.ok(link.tooltip, 'Link should have tooltip');
                assert.ok(link.tooltip!.includes('Open'), 'Tooltip should include "Open"');
            });
        });
    });

    suite('Bookmap Support', () => {
        test('Should work with .bookmap files', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-bookmap.bookmap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should return links array (even if empty for this particular bookmap)
            assert.ok(links !== null && links !== undefined, 'Should return links for bookmap files');
        });

        test('Should detect href in chapter elements', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'bookmap-with-chapters.bookmap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            console.log('Chapter links found:', links?.length || 0);
            if (links) {
                links.forEach(link => {
                    console.log('  - Link to:', document.getText(link.range));
                });
            }

            assert.ok(links, 'Should return links');
            assert.ok(links!.length > 0, 'Should find links in chapter elements');

            // Should find link to valid-map.ditamap in chapter element
            const chapterLink = links!.find(link =>
                link.target?.fsPath.includes('valid-map.ditamap')
            );
            assert.ok(chapterLink, 'Should find link to .ditamap in chapter element');
        });

        test('Should detect href in appendix elements', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'bookmap-with-chapters.bookmap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link in appendix element
            const appendixLink = links!.find(link =>
                link.target?.fsPath.includes('no-doctype.dita')
            );
            assert.ok(appendixLink, 'Should find link in appendix element');
        });

        test('Should detect href in part elements', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'bookmap-with-chapters.bookmap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link in part element
            const partLink = links!.find(link =>
                link.target?.fsPath.includes('valid-topic.dita')
            );
            assert.ok(partLink, 'Should find link in part element');
        });
    });

    suite('Map Reference Support', () => {
        test('Should detect href in mapref elements', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'map-with-mapref.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            console.log('Mapref links found:', links?.length || 0);
            if (links) {
                links.forEach(link => {
                    console.log('  - Link to:', document.getText(link.range));
                });
            }

            assert.ok(links, 'Should return links');
            assert.ok(links!.length > 0, 'Should find links in map');

            // Should find link to another .ditamap in mapref element
            const maprefLink = links!.find(link =>
                link.target?.fsPath.includes('valid-map.ditamap')
            );
            assert.ok(maprefLink, 'Should find link to .ditamap in mapref element');
        });

        test('Should detect href in keydef elements', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'map-with-mapref.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link in keydef element
            const keydefLink = links!.find(link =>
                link.target?.fsPath.includes('empty-elements.dita')
            );
            assert.ok(keydefLink, 'Should find link in keydef element');
        });

        test('Should detect href in nested elements within topicgroup', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'map-with-mapref.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find nested mapref to bookmap
            const nestedMapref = links!.find(link =>
                link.target?.fsPath.includes('bookmap-with-chapters.bookmap')
            );
            assert.ok(nestedMapref, 'Should find link in nested mapref element');
        });
    });

    suite('Edge Cases', () => {
        test('Should handle empty href gracefully', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-map.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            // Should not throw error
            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            assert.ok(links !== null, 'Should return links array');
        });

        test('Should handle documents with no topicref elements', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'valid-topic.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            assert.ok(links !== null, 'Should return empty or non-null links array');
            assert.strictEqual(links!.length, 0, 'Should find no links in topic file');
        });
    });

    suite('Content Reference Support (conref)', () => {
        test('Should detect conref attributes in topic files', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            console.log('Conref links found:', links?.length || 0);
            if (links) {
                links.forEach(link => {
                    console.log('  - Link to:', document.getText(link.range), '-> Target:', link.target?.fsPath);
                });
            }

            assert.ok(links, 'Should return links');
            assert.ok(links!.length > 0, 'Should find conref links in topic');

            // Should find link to valid-topic.dita via conref
            const conrefLink = links!.find(link =>
                link.target?.fsPath.includes('valid-topic.dita') &&
                link.tooltip?.includes('content reference')
            );
            assert.ok(conrefLink, 'Should find conref link to valid-topic.dita');
        });

        test('Should handle conref with fragment identifiers', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Conref with fragment should still link to the file (fragment stripped)
            const fragmentLink = links!.find(link =>
                link.target?.fsPath.includes('empty-elements.dita')
            );

            assert.ok(fragmentLink, 'Should handle conref with fragment identifier');
            assert.ok(!fragmentLink!.target?.fsPath.includes('#'), 'Fragment should be removed from path');
        });

        test('Should handle conref with relative paths', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // All conref links should have absolute paths
            links!.forEach(link => {
                if (link.target) {
                    assert.ok(path.isAbsolute(link.target.fsPath),
                        `Conref link target should be absolute path: ${link.target.fsPath}`);
                }
            });
        });

        test('Conref tooltip should indicate content reference', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Find a conref link
            const conrefLink = links!.find(link =>
                link.tooltip?.includes('content reference')
            );

            assert.ok(conrefLink, 'Should have at least one conref link');
            assert.ok(conrefLink!.tooltip!.toLowerCase().includes('content reference'),
                'Conref tooltip should mention "content reference"');
        });
    });

    suite('Content Key Reference Support (conkeyref)', () => {
        test('Should detect conkeyref attributes with filenames', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link via conkeyref that contains a filename
            const conkeyrefLink = links!.find(link =>
                link.target?.fsPath.includes('valid-topic.dita') &&
                link.tooltip?.includes('content key reference')
            );

            assert.ok(conkeyrefLink, 'Should find conkeyref link with filename');
        });

        test('Should skip pure key conkeyref without filenames', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should not create links for pure keys like "reusable-content/warning"
            const pureKeyLinks = links!.filter(link => {
                const text = document.getText(link.range);
                return text === 'reusable-content/warning';
            });

            assert.strictEqual(pureKeyLinks.length, 0,
                'Should not create links for pure key references without filenames');
        });

        test('Conkeyref tooltip should indicate content key reference', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Find a conkeyref link
            const conkeyrefLink = links!.find(link =>
                link.tooltip?.includes('content key reference')
            );

            if (conkeyrefLink) {
                assert.ok(conkeyrefLink.tooltip!.toLowerCase().includes('content key reference'),
                    'Conkeyref tooltip should mention "content key reference"');
            }
        });
    });

    suite('Key Reference Support (keyref)', () => {
        test('Should detect keyref attributes with filenames', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link via keyref that contains a filename
            const keyrefLink = links!.find(link =>
                link.target?.fsPath.includes('no-doctype.dita') &&
                link.tooltip?.includes('key reference')
            );

            assert.ok(keyrefLink, 'Should find keyref link with filename');
        });

        test('Should skip pure key keyref without filenames', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should not create links for pure keys like "product-name"
            const pureKeyLinks = links!.filter(link => {
                const text = document.getText(link.range);
                return text === 'product-name';
            });

            assert.strictEqual(pureKeyLinks.length, 0,
                'Should not create links for pure key references without filenames');
        });

        test('Keyref tooltip should indicate key reference', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Find a keyref link
            const keyrefLink = links!.find(link =>
                link.tooltip?.includes('key reference')
            );

            if (keyrefLink) {
                assert.ok(keyrefLink.tooltip!.toLowerCase().includes('key reference'),
                    'Keyref tooltip should mention "key reference"');
            }
        });
    });

    suite('Mixed References', () => {
        test('Should detect all reference types in same document', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            console.log('Total links found:', links?.length || 0);

            // Should have links from conref, conkeyref, and keyref
            const conrefLinks = links!.filter(link => link.tooltip?.includes('content reference'));
            const conkeyrefLinks = links!.filter(link => link.tooltip?.includes('content key reference'));
            const keyrefLinks = links!.filter(link => link.tooltip?.includes('key reference') && !link.tooltip?.includes('content'));

            console.log('  - Conref links:', conrefLinks.length);
            console.log('  - Conkeyref links:', conkeyrefLinks.length);
            console.log('  - Keyref links:', keyrefLinks.length);

            assert.ok(conrefLinks.length > 0, 'Should find at least one conref link');
            assert.ok(links!.length >= 3, 'Should find multiple types of references');
        });

        test('Should not duplicate links for same target', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Check that each link has a unique range
            const ranges = links!.map(link => `${link.range.start.line}:${link.range.start.character}`);
            const uniqueRanges = new Set(ranges);

            assert.strictEqual(ranges.length, uniqueRanges.size,
                'Each link should have a unique range (no duplicates)');
        });
    });

    suite('Integration Tests', () => {
        test('Link provider should be registered for DITA language', async function() {
            this.timeout(5000);

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'test-map-with-links.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);
            await vscode.window.showTextDocument(document);

            // Wait a bit for providers to register
            await new Promise(resolve => setTimeout(resolve, 500));

            // Request document links from VS Code's document link system
            const links = await vscode.commands.executeCommand<vscode.DocumentLink[]>(
                'vscode.executeLinkProvider',
                fileUri
            );

            console.log('Integration test - Links found by VS Code:', links?.length || 0);
            if (links) {
                links.forEach(link => {
                    console.log('  - Link:', document.getText(link.range), '->', link.target?.toString());
                });
            }

            assert.ok(links, 'VS Code should return links from registered provider');
            assert.ok(links!.length > 0, 'Should find links via VS Code document link system');
        });

        test('Should provide clickable links in editor', async function() {
            this.timeout(5000);

            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'test-map-with-links.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);
            const editor = await vscode.window.showTextDocument(document);

            // Wait for providers to initialize
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify document is open and language is correct
            assert.strictEqual(editor.document.languageId, 'dita', 'Document should have DITA language ID');

            // Get links from our provider directly
            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            console.log('Direct provider - Links found:', links?.length || 0);

            assert.ok(links, 'Provider should return links');
            assert.ok(links!.length > 0, 'Provider should find links in test map');
        });
    });
});

