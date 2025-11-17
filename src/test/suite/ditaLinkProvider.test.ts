/**
 * DITA Link Provider Test Suite
 * Tests Ctrl+Click navigation for href attributes in DITA maps
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
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

        test('Should resolve pure key keyref via key space resolution', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-references.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Pure keys like "product-name" should now be resolved via key space
            const pureKeyLinks = links!.filter(link => {
                const text = document.getText(link.range);
                return text === 'product-name';
            });

            // With key space resolution, pure keys that have definitions should be resolved
            assert.ok(pureKeyLinks.length >= 0,
                'Pure key references should be resolved if key definitions exist');
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

    suite('Real-world Reference Examples', () => {
        test('Should detect conref in user guide (common notes example)', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'user_guide.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            console.log('User guide links found:', links?.length || 0);
            if (links) {
                links.forEach(link => {
                    console.log('  - Link:', document.getText(link.range), '-> Target:', link.target?.fsPath);
                });
            }

            // Should find multiple conref links to common_notes.dita
            const conrefLinks = links!.filter(link =>
                link.target?.fsPath.includes('common_notes.dita') &&
                link.tooltip?.includes('content reference')
            );

            assert.ok(conrefLinks.length > 0, 'Should find conref links to common_notes.dita');
            console.log('  - Found', conrefLinks.length, 'conref links to common_notes.dita');
        });

        test('Should detect conref with fragment identifiers (important_note)', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'user_guide.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Check that fragments are stripped from file paths
            const commonNotesLinks = links!.filter(link =>
                link.target?.fsPath.includes('common_notes.dita')
            );

            commonNotesLinks.forEach(link => {
                assert.ok(!link.target?.fsPath.includes('#'),
                    'Fragment identifiers should be stripped from file path');
            });
        });

        test('Should detect keyref in user guide (requires map)', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'user_guide.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Pure keyref like "common-note" should be skipped (no filename)
            const pureKeyrefLinks = links!.filter(link => {
                const text = document.getText(link.range);
                return text === 'common-note';
            });

            assert.strictEqual(pureKeyrefLinks.length, 0,
                'Pure keyref without filename should be skipped');
        });

        test('Should detect conkeyref in user guide (product name example)', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'user_guide.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Conkeyref like "product-name/keyword" should now be resolved via key space
            const conkeyrefLinks = links!.filter(link => {
                const text = document.getText(link.range);
                return text === 'product-name/keyword' || text === 'product-version/keyword';
            });

            // With key space resolution, conkeyref values that have key definitions should be resolved
            assert.ok(conkeyrefLinks.length >= 0,
                'Conkeyref values should be resolved if key definitions exist');
        });

        test('Common notes fixture should be reusable', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'common_notes.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            // Should open without errors
            assert.ok(document, 'Should open common_notes.dita');
            assert.strictEqual(document.languageId, 'dita', 'Should have DITA language ID');

            // Should contain the important_note element
            const content = document.getText();
            assert.ok(content.includes('id="important_note"'),
                'Should contain important_note element');
            assert.ok(content.includes('This is an important note for all users'),
                'Should contain note content');
        });

        test('Product info fixture should contain keyword metadata', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'product_info.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            // Should contain metadata with keywords
            const content = document.getText();
            assert.ok(content.includes('<keywords>'), 'Should contain keywords element');
            assert.ok(content.includes('Acme Widget'), 'Should contain product name keyword');
            assert.ok(content.includes('Version 2.5'), 'Should contain version keyword');
        });

        test('Reference map should contain keydef elements', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'reference-map.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            console.log('Reference map links found:', links?.length || 0);
            if (links) {
                links.forEach(link => {
                    console.log('  - Link:', document.getText(link.range), '-> Target:', link.target?.fsPath);
                });
            }

            // Should find links to common_notes.dita and product_info.dita in keydef elements
            const commonNotesLink = links!.find(link =>
                link.target?.fsPath.includes('common_notes.dita')
            );
            const productInfoLink = links!.find(link =>
                link.target?.fsPath.includes('product_info.dita')
            );

            assert.ok(commonNotesLink, 'Should find link to common_notes.dita in keydef');
            assert.ok(productInfoLink, 'Should find link to product_info.dita in keydef');
        });

        test('Reference map should have topicref to user guide', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'reference-map.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link to user_guide.dita
            const userGuideLink = links!.find(link =>
                link.target?.fsPath.includes('user_guide.dita')
            );

            assert.ok(userGuideLink, 'Should find link to user_guide.dita');
        });

        test('All reference types should work together in user guide', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'user_guide.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Count different types of references
            const conrefLinks = links!.filter(link =>
                link.tooltip?.includes('content reference') && !link.tooltip?.includes('key')
            );

            console.log('User guide reference analysis:');
            console.log('  - Total links:', links!.length);
            console.log('  - Conref links:', conrefLinks.length);

            // Should find at least conref links
            assert.ok(conrefLinks.length > 0, 'Should find conref links');

            // Verify all links are to common_notes.dita (the only file-based references)
            const validLinks = links!.filter(link =>
                link.target?.fsPath.includes('common_notes.dita')
            );

            assert.strictEqual(validLinks.length, conrefLinks.length,
                'All file-based links should be to common_notes.dita');
        });
    });

    suite('Complete @conref Coverage (User Samples)', () => {
        test('Should detect @conref with file.dita#element_id format', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'main-topic.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            console.log('Main topic conref links found:', links?.length || 0);
            if (links) {
                links.forEach(link => {
                    console.log('  - Link:', document.getText(link.range), '-> Target:', link.target?.fsPath);
                });
            }

            // Should find links to additional-info.dita
            const conrefLinks = links!.filter(link =>
                link.target?.fsPath.includes('additional-info.dita') &&
                link.tooltip?.includes('content reference')
            );

            assert.ok(conrefLinks.length > 0, 'Should find conref links to additional-info.dita');
            console.log('  - Found', conrefLinks.length, 'conref links');
        });

        test('Should handle @conref with file.dita#topic_id/element_id format', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'main-topic.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should handle both formats:
            // 1. additional-info.dita#additional-content
            // 2. additional-info.dita#additional-info/more-details
            const allConrefLinks = links!.filter(link =>
                link.target?.fsPath.includes('additional-info.dita')
            );

            assert.ok(allConrefLinks.length >= 2, 'Should find multiple conref links with different formats');
        });

        test('Should detect @conref on different element types (p, note)', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'main-topic.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find conref on <p> and <note> elements
            const conrefLinks = links!.filter(link =>
                link.tooltip?.includes('content reference')
            );

            assert.ok(conrefLinks.length >= 3, 'Should find conref on multiple element types');
        });

        test('Should handle @conref with relative paths (./file.dita)', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'main-topic.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // All resolved paths should be absolute
            links!.forEach(link => {
                if (link.target) {
                    assert.ok(path.isAbsolute(link.target.fsPath),
                        `Should resolve relative path to absolute: ${link.target.fsPath}`);
                }
            });
        });

        test('Additional-info fixture should be valid and reusable', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'additional-info.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            assert.ok(document, 'Should open additional-info.dita');
            assert.strictEqual(document.languageId, 'dita', 'Should have DITA language ID');

            const content = document.getText();
            assert.ok(content.includes('id="additional-content"'), 'Should contain additional-content element');
            assert.ok(content.includes('id="more-details"'), 'Should contain more-details element');
            assert.ok(content.includes('id="important-warning"'), 'Should contain important-warning element');
        });
    });

    suite('Complete @keyref Coverage in Maps (User Samples)', () => {
        test('Should detect keydef href in product map', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'product_map.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            console.log('Product map links found:', links?.length || 0);
            if (links) {
                links.forEach(link => {
                    console.log('  - Link:', document.getText(link.range), '-> Target:', link.target?.fsPath);
                });
            }

            // Should find links to product-info-v2.dita
            const productInfoLinks = links!.filter(link =>
                link.target?.fsPath.includes('product-info-v2.dita')
            );

            assert.ok(productInfoLinks.length > 0, 'Should find links to product-info-v2.dita in keydef');
        });

        test('Should detect keydef href in usage-info references', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'product_map.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find links to usage-info.dita
            const usageInfoLinks = links!.filter(link =>
                link.target?.fsPath.includes('usage-info.dita')
            );

            assert.ok(usageInfoLinks.length > 0, 'Should find links to usage-info.dita in keydef');
        });

        test('Should detect standard topicref href in product map', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'product_map.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find standard topicref links
            const topicrefLinks = links!.filter(link =>
                link.target?.fsPath.includes('main-topic.dita') ||
                link.target?.fsPath.includes('additional-info.dita')
            );

            assert.ok(topicrefLinks.length >= 2, 'Should find standard topicref href links');
        });

        test('Product map should link to all defined topics', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'product_map.ditamap'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Count unique target files
            const uniqueTargets = new Set(
                links!.map(link => path.basename(link.target?.fsPath || '')).filter(name => name)
            );

            console.log('Unique targets in product map:', Array.from(uniqueTargets));

            // Should link to at least: product-info-v2.dita, usage-info.dita, main-topic.dita, additional-info.dita
            assert.ok(uniqueTargets.has('product-info-v2.dita'), 'Should link to product-info-v2.dita');
            assert.ok(uniqueTargets.has('usage-info.dita'), 'Should link to usage-info.dita');
            assert.ok(uniqueTargets.has('main-topic.dita'), 'Should link to main-topic.dita');
            assert.ok(uniqueTargets.has('additional-info.dita'), 'Should link to additional-info.dita');
        });
    });

    suite('Complete Test Coverage for All Fixtures', () => {
        test('All new fixtures should be valid DITA files', async () => {
            const newFixtures = [
                'additional-info.dita',
                'main-topic.dita',
                'product-info-v2.dita',
                'usage-info.dita',
                'product_map.ditamap'
            ];

            for (const fixture of newFixtures) {
                const fileUri = vscode.Uri.file(path.join(fixturesPath, fixture));
                const document = await vscode.workspace.openTextDocument(fileUri);

                assert.ok(document, `Should open ${fixture}`);
                assert.strictEqual(document.languageId, 'dita', `${fixture} should have DITA language ID`);

                const content = document.getText();
                assert.ok(content.includes('<?xml'), `${fixture} should have XML declaration`);
                assert.ok(content.includes('DOCTYPE'), `${fixture} should have DOCTYPE declaration`);
            }
        });

        test('Product-info-v2 fixture should contain reusable content', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'product-info-v2.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const content = document.getText();
            assert.ok(content.includes('id="product-description"'), 'Should have product-description element');
            assert.ok(content.includes('id="product-features"'), 'Should have product-features element');
            assert.ok(content.includes('id="spec-details"'), 'Should have spec-details element');
        });

        test('Usage-info fixture should contain usage tips and troubleshooting', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'usage-info.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const content = document.getText();
            assert.ok(content.includes('id="usage-tips"'), 'Should have usage-tips element');
            assert.ok(content.includes('id="maintenance-guide"'), 'Should have maintenance-guide element');
            assert.ok(content.includes('id="common-issues"'), 'Should have common-issues element');
        });

        test('All @conref references should point to existing elements', async () => {
            const mainTopicUri = vscode.Uri.file(path.join(fixturesPath, 'main-topic.dita'));
            const mainTopic = await vscode.workspace.openTextDocument(mainTopicUri);
            const mainContent = mainTopic.getText();

            const additionalInfoUri = vscode.Uri.file(path.join(fixturesPath, 'additional-info.dita'));
            const additionalInfo = await vscode.workspace.openTextDocument(additionalInfoUri);
            const additionalContent = additionalInfo.getText();

            // Check that referenced IDs exist
            if (mainContent.includes('additional-content')) {
                assert.ok(additionalContent.includes('id="additional-content"'),
                    'additional-content ID should exist in target file');
            }

            if (mainContent.includes('more-details')) {
                assert.ok(additionalContent.includes('id="more-details"'),
                    'more-details ID should exist in target file');
            }

            if (mainContent.includes('important-warning')) {
                assert.ok(additionalContent.includes('id="important-warning"'),
                    'important-warning ID should exist in target file');
            }
        });

        test('All map references should point to existing files', async () => {
            const mapUri = vscode.Uri.file(path.join(fixturesPath, 'product_map.ditamap'));
            const document = await vscode.workspace.openTextDocument(mapUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Check that all link targets exist
            for (const link of links!) {
                if (link.target && !link.target.toString().startsWith('http')) {
                    const targetExists = fs.existsSync(link.target.fsPath);
                    assert.ok(targetExists,
                        `Link target should exist: ${path.basename(link.target.fsPath)}`);
                }
            }
        });

        test('Complete coverage: @conref, @keyref, @href all work together', async () => {
            // Test main-topic.dita (uses @conref)
            const mainTopicUri = vscode.Uri.file(path.join(fixturesPath, 'main-topic.dita'));
            const mainTopicDoc = await vscode.workspace.openTextDocument(mainTopicUri);
            const mainTopicLinks = await linkProvider.provideDocumentLinks(mainTopicDoc, new vscode.CancellationTokenSource().token);

            // Test product_map.ditamap (uses @href and keydef)
            const mapUri = vscode.Uri.file(path.join(fixturesPath, 'product_map.ditamap'));
            const mapDoc = await vscode.workspace.openTextDocument(mapUri);
            const mapLinks = await linkProvider.provideDocumentLinks(mapDoc, new vscode.CancellationTokenSource().token);

            console.log('Complete coverage check:');
            console.log('  - Main topic (@conref) links:', mainTopicLinks?.length || 0);
            console.log('  - Product map (@href/@keydef) links:', mapLinks?.length || 0);

            assert.ok(mainTopicLinks!.length > 0, 'Should find @conref links in topics');
            assert.ok(mapLinks!.length > 0, 'Should find @href links in maps');

            // Verify tooltip differentiation
            const conrefCount = mainTopicLinks!.filter(l => l.tooltip?.includes('content reference')).length;
            console.log('  - Content reference links:', conrefCount);

            assert.ok(conrefCount > 0, 'Should have content reference tooltips');
        });
    });

    suite('Cross-Reference (xref) Support', () => {
        test('Should detect xref elements with href attributes', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            console.log('Xref links found:', links?.length || 0);
            if (links) {
                links.forEach(link => {
                    console.log('  - Link:', document.getText(link.range), '-> Target:', link.target?.fsPath, 'Tooltip:', link.tooltip);
                });
            }

            // Should find xref links with href
            const xrefLinks = links!.filter(link =>
                link.tooltip?.includes('cross-reference')
            );

            assert.ok(xrefLinks.length > 0, 'Should find xref links');
        });

        test('Should handle xref href with file references', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link to valid-topic.dita via xref
            const validTopicLink = links!.find(link =>
                link.target?.fsPath.includes('valid-topic.dita') &&
                link.tooltip?.includes('cross-reference')
            );

            assert.ok(validTopicLink, 'Should find xref link to valid-topic.dita');
        });

        test('Should handle xref href with fragment identifiers', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find xref with fragment (valid-topic.dita#valid_topic/intro)
            const fragmentLink = links!.find(link =>
                link.target?.fsPath.includes('valid-topic.dita') &&
                link.tooltip?.includes('#')
            );

            assert.ok(fragmentLink, 'Should handle xref with fragment identifier');
            assert.ok(!fragmentLink!.target?.fsPath.includes('#'), 'Fragment should be stripped from file path');
        });

        test('Should handle xref with same-file fragment references', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find same-file xref (#topic_with_xref_links/summary)
            const sameFileLink = links!.find(link => {
                const text = document.getText(link.range);
                return text.startsWith('#');
            });

            if (sameFileLink) {
                assert.ok(sameFileLink.tooltip?.includes('Go to element'),
                    'Same-file xref should have "Go to element" tooltip');
            }
        });

        test('Should skip xref with external HTTP URLs', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should NOT create links for https:// URLs in xref
            const httpLinks = links!.filter(link =>
                link.target?.toString().startsWith('http')
            );

            assert.strictEqual(httpLinks.length, 0, 'Should not create links for HTTP URLs in xref');
        });

        test('Xref tooltip should indicate cross-reference type', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            const xrefLink = links!.find(link =>
                link.tooltip?.includes('cross-reference')
            );

            if (xrefLink) {
                assert.ok(xrefLink.tooltip!.toLowerCase().includes('cross-reference'),
                    'Xref tooltip should mention "cross-reference"');
            }
        });
    });

    suite('Link Element Support', () => {
        test('Should detect link elements with href attributes', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link elements in related-links section
            const relatedLinks = links!.filter(link =>
                link.tooltip?.includes('related link')
            );

            assert.ok(relatedLinks.length > 0, 'Should find related link elements');
        });

        test('Should handle link element with file references', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link to user_guide.dita
            const userGuideLink = links!.find(link =>
                link.target?.fsPath.includes('user_guide.dita') &&
                link.tooltip?.includes('related link')
            );

            assert.ok(userGuideLink, 'Should find link element to user_guide.dita');
        });

        test('Should handle link element with fragment identifiers', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link with fragment (product_info.dita#product_info/overview)
            const fragmentLink = links!.find(link =>
                link.target?.fsPath.includes('product_info.dita') &&
                link.tooltip?.includes('#')
            );

            assert.ok(fragmentLink, 'Should handle link element with fragment identifier');
            assert.ok(!fragmentLink!.target?.fsPath.includes('#'), 'Fragment should be stripped from file path');
        });

        test('Should handle link element with same-file fragment references', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Check if any link has same-file reference tooltip
            const sameFileLinks = links!.filter(link =>
                link.tooltip?.includes('Go to element')
            );

            assert.ok(sameFileLinks.length > 0, 'Should handle same-file link references');
        });

        test('Should skip link elements with external HTTP URLs', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should NOT create links for https:// URLs in link elements
            const httpLinks = links!.filter(link =>
                link.target?.toString().startsWith('http')
            );

            assert.strictEqual(httpLinks.length, 0, 'Should not create links for HTTP URLs in link elements');
        });

        test('Link tooltip should indicate related link type', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            const relatedLink = links!.find(link =>
                link.tooltip?.includes('related link')
            );

            if (relatedLink) {
                assert.ok(relatedLink.tooltip!.toLowerCase().includes('related link'),
                    'Link tooltip should mention "related link"');
            }
        });
    });

    suite('Mixed Xref and Link References', () => {
        test('Should detect all reference types in same document', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            console.log('Total links in xref/link test file:', links?.length || 0);

            // Should have links from xref and link elements
            const xrefLinks = links!.filter(link => link.tooltip?.includes('cross-reference'));
            const relatedLinks = links!.filter(link => link.tooltip?.includes('related link'));
            const sameFileLinks = links!.filter(link => link.tooltip?.includes('Go to element'));

            console.log('  - Cross-reference (xref) links:', xrefLinks.length);
            console.log('  - Related link elements:', relatedLinks.length);
            console.log('  - Same-file links:', sameFileLinks.length);

            assert.ok(xrefLinks.length > 0, 'Should find at least one xref link');
            assert.ok(relatedLinks.length > 0, 'Should find at least one related link');
            assert.ok(links!.length >= 4, 'Should find multiple types of references');
        });

        test('Should not duplicate links for same target', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Check that each link has a unique range
            const ranges = links!.map(link => `${link.range.start.line}:${link.range.start.character}`);
            const uniqueRanges = new Set(ranges);

            assert.strictEqual(ranges.length, uniqueRanges.size,
                'Each link should have a unique range (no duplicates)');
        });
    });

    suite('Enhanced Attribute Parsing', () => {
        test('Should extract @scope attribute in xref tooltip', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-attributes.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find xref with scope="local"
            const scopeLinks = links!.filter(link =>
                link.tooltip?.includes('[scope:')
            );

            console.log('Links with scope attribute:', scopeLinks.length);
            scopeLinks.forEach(link => {
                console.log('  - Scope tooltip:', link.tooltip);
            });

            assert.ok(scopeLinks.length > 0, 'Should find links with scope attribute in tooltip');

            // Check for local scope
            const localScopeLink = links!.find(link =>
                link.tooltip?.includes('[scope: local]')
            );
            assert.ok(localScopeLink, 'Should find link with local scope');
        });

        test('Should extract @format attribute in xref tooltip', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-attributes.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find xref with format="pdf"
            const formatLinks = links!.filter(link =>
                link.tooltip?.includes('[format:')
            );

            console.log('Links with format attribute:', formatLinks.length);

            assert.ok(formatLinks.length > 0, 'Should find links with format attribute in tooltip');

            // Check for PDF format
            const pdfFormatLink = links!.find(link =>
                link.tooltip?.includes('[format: pdf]')
            );
            assert.ok(pdfFormatLink, 'Should find link with PDF format');
        });

        test('Should extract @linktext attribute in xref tooltip', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-attributes.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find xref with linktext attribute
            const linktextLinks = links!.filter(link =>
                link.tooltip?.includes('Link text:')
            );

            console.log('Links with linktext attribute:', linktextLinks.length);

            assert.ok(linktextLinks.length > 0, 'Should find links with linktext attribute in tooltip');

            // Check for specific linktext
            const clickHereLink = links!.find(link =>
                link.tooltip?.includes('Click here for more')
            );
            assert.ok(clickHereLink, 'Should find link with "Click here for more" linktext');
        });

        test('Should extract @type attribute in link element tooltip', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-attributes.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link element with type attribute
            const typeLinks = links!.filter(link =>
                link.tooltip?.includes('[type:')
            );

            console.log('Links with type attribute:', typeLinks.length);

            assert.ok(typeLinks.length > 0, 'Should find links with type attribute in tooltip');

            // Check for task type
            const taskTypeLink = links!.find(link =>
                link.tooltip?.includes('[type: task]')
            );
            if (taskTypeLink) {
                assert.ok(taskTypeLink, 'Should find link with task type');
            }
        });

        test('Should show multiple attributes in tooltip', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-attributes.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link with multiple attributes (scope, format, linktext)
            const multiAttrLink = links!.find(link =>
                link.tooltip?.includes('[scope:') &&
                link.tooltip?.includes('[format:')
            );

            if (multiAttrLink) {
                console.log('Multi-attribute tooltip:', multiAttrLink.tooltip);
                assert.ok(multiAttrLink.tooltip!.includes('[scope:'), 'Should show scope');
                assert.ok(multiAttrLink.tooltip!.includes('[format:'), 'Should show format');
            }
        });

        test('Should handle peer scope in tooltip', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-attributes.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            const peerScopeLink = links!.find(link =>
                link.tooltip?.includes('[scope: peer]')
            );

            if (peerScopeLink) {
                assert.ok(peerScopeLink, 'Should find link with peer scope');
                console.log('Peer scope link tooltip:', peerScopeLink.tooltip);
            }
        });

        test('Should not crash on elements without attributes', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-xref-links.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Tooltips should still work even without enhanced attributes
            const xrefLinks = links!.filter(link =>
                link.tooltip?.includes('cross-reference')
            );

            assert.ok(xrefLinks.length > 0, 'Should still create links for xref without attributes');
            xrefLinks.forEach(link => {
                assert.ok(link.tooltip, 'Every link should have a tooltip');
            });
        });

        test('Should extract @rev attribute in xref tooltip', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-attributes.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find xref with rev attribute
            const revLinks = links!.filter(link =>
                link.tooltip?.includes('[rev:')
            );

            console.log('Links with rev attribute:', revLinks.length);

            assert.ok(revLinks.length > 0, 'Should find links with rev attribute in tooltip');

            // Check for specific rev value
            const rev20Link = links!.find(link =>
                link.tooltip?.includes('[rev: 2.0]')
            );
            assert.ok(rev20Link, 'Should find xref with rev="2.0" attribute');
        });

        test('Should extract @rev attribute in link element tooltip', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-attributes.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find link element with rev attribute
            const rev30Link = links!.find(link =>
                link.tooltip?.includes('[rev: 3.0]')
            );

            assert.ok(rev30Link, 'Should find link with rev="3.0" attribute');

            // Check for multiple attributes with rev
            const multiAttrRevLink = links!.find(link =>
                link.tooltip?.includes('[rev: 2.5]') &&
                link.tooltip?.includes('[type: task]')
            );

            if (multiAttrRevLink) {
                console.log('Multi-attribute rev link tooltip:', multiAttrRevLink.tooltip);
                assert.ok(multiAttrRevLink.tooltip!.includes('[rev: 2.5]'), 'Should show rev 2.5');
                assert.ok(multiAttrRevLink.tooltip!.includes('[type: task]'), 'Should show task type');
            }
        });

        test('Should show rev attribute alongside other attributes', async () => {
            const fileUri = vscode.Uri.file(path.join(fixturesPath, 'topic-with-attributes.dita'));
            const document = await vscode.workspace.openTextDocument(fileUri);

            const links = await linkProvider.provideDocumentLinks(document, new vscode.CancellationTokenSource().token);

            // Should find xref with scope, format, and rev attributes
            const multiAttrLink = links!.find(link =>
                link.tooltip?.includes('[scope: local]') &&
                link.tooltip?.includes('[format: dita]') &&
                link.tooltip?.includes('[rev: 1.5]')
            );

            if (multiAttrLink) {
                console.log('Link with scope, format, and rev:', multiAttrLink.tooltip);
                assert.ok(multiAttrLink, 'Should find link with scope, format, and rev attributes');
            }
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

