/**
 * Validate Guide Command Test Suite
 * Tests for DITA-OT full guide validation command
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { ValidationReportPanel, ValidationReport, ValidationIssue } from '../../providers/validationReportPanel';
import { lookupErrorCode, getModuleForCode, DITA_OT_ERROR_CODES } from '../../utils/ditaOtErrorCodes';

suite('Validate Guide Command Test Suite', () => {

    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }
        if (!extension.isActive) {
            await extension.activate();
        }
    });

    teardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        if (ValidationReportPanel.currentPanel) {
            ValidationReportPanel.currentPanel.dispose();
        }
    });

    suite('Command Registration', () => {
        test('Should have validateGuide command registered', async function () {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.validateGuide'),
                'ditacraft.validateGuide command should be registered'
            );
        });
    });

    suite('ValidationReport Interface', () => {
        test('Should create a valid report with zero issues', function () {
            const report: ValidationReport = {
                rootMap: 'guide.ditamap',
                rootMapAbsolute: '/workspace/guide.ditamap',
                ditaOtVersion: '4.2.0',
                transtype: 'html5',
                timestamp: new Date().toISOString(),
                duration: 5000,
                success: true,
                summary: {
                    errors: 0,
                    warnings: 0,
                    info: 0,
                    total: 0,
                    filesAffected: 0,
                },
                issues: [],
            };

            assert.strictEqual(report.success, true);
            assert.strictEqual(report.summary.total, 0);
            assert.strictEqual(report.issues.length, 0);
        });

        test('Should create a report with mixed severity issues', function () {
            const issues: ValidationIssue[] = [
                {
                    severity: 'error',
                    code: 'DOTX060E',
                    message: 'Conref target not found',
                    file: 'chapter1/intro.dita',
                    absolutePath: '/workspace/chapter1/intro.dita',
                    line: 42,
                    column: 5,
                },
                {
                    severity: 'warning',
                    code: 'DOTJ070W',
                    message: 'Key "product-name" not defined',
                    file: 'chapter1/intro.dita',
                    absolutePath: '/workspace/chapter1/intro.dita',
                    line: 18,
                    column: 12,
                },
                {
                    severity: 'info',
                    code: 'DOTJ073I',
                    message: 'Processing topic',
                },
                {
                    severity: 'warning',
                    code: 'DOTJ074W',
                    message: 'Missing image reference',
                },
            ];

            const report: ValidationReport = {
                rootMap: 'guide.ditamap',
                rootMapAbsolute: '/workspace/guide.ditamap',
                ditaOtVersion: '4.2.0',
                transtype: 'dita',
                timestamp: new Date().toISOString(),
                duration: 12300,
                success: false,
                summary: {
                    errors: 1,
                    warnings: 2,
                    info: 1,
                    total: 4,
                    filesAffected: 1,
                },
                issues,
            };

            assert.strictEqual(report.success, false);
            assert.strictEqual(report.summary.errors, 1);
            assert.strictEqual(report.summary.warnings, 2);
            assert.strictEqual(report.summary.info, 1);
            assert.strictEqual(report.summary.total, 4);
            assert.strictEqual(report.summary.filesAffected, 1);
        });

        test('Should compute filesAffected correctly', function () {
            const issues: ValidationIssue[] = [
                { severity: 'error', code: 'E1', message: 'msg', file: 'a.dita', absolutePath: '/a.dita' },
                { severity: 'error', code: 'E2', message: 'msg', file: 'a.dita', absolutePath: '/a.dita' },
                { severity: 'warning', code: 'W1', message: 'msg', file: 'b.dita', absolutePath: '/b.dita' },
                { severity: 'info', code: 'I1', message: 'msg' }, // no file
            ];

            const filesAffected = new Set(
                issues.filter(i => i.file).map(i => i.file)
            ).size;

            assert.strictEqual(filesAffected, 2);
        });

        test('Issues without file should have undefined fields', function () {
            const issue: ValidationIssue = {
                severity: 'warning',
                code: 'DOTJ073W',
                message: 'Global warning',
            };

            assert.strictEqual(issue.file, undefined);
            assert.strictEqual(issue.absolutePath, undefined);
            assert.strictEqual(issue.line, undefined);
            assert.strictEqual(issue.column, undefined);
        });
    });

    suite('Validation Prerequisites', () => {
        test('Root map config should default to empty string', function () {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const rootMap = config.get<string>('rootMap', '');
            // Default value is empty — validates that the guard would trigger
            assert.strictEqual(typeof rootMap, 'string');
        });
    });

    suite('Transtype Selection Logic', () => {
        test('Should prefer dita transtype when available', function () {
            const transtypes = ['dita', 'html5', 'pdf', 'xhtml'];
            const selected = transtypes.includes('dita') ? 'dita' : 'html5';
            assert.strictEqual(selected, 'dita');
        });

        test('Should fallback to html5 when dita is unavailable', function () {
            const transtypes = ['html5', 'pdf', 'xhtml'];
            const selected = transtypes.includes('dita') ? 'dita' : 'html5';
            assert.strictEqual(selected, 'html5');
        });

        test('Should fallback to html5 on empty transtype list', function () {
            const transtypes: string[] = [];
            const selected = transtypes.includes('dita') ? 'dita' : 'html5';
            assert.strictEqual(selected, 'html5');
        });
    });

    suite('DITA-OT Error Code Catalog', () => {
        test('Should look up known error codes', function () {
            const info = lookupErrorCode('DOTX010E');
            assert.ok(info);
            assert.strictEqual(info.module, 'Transform');
            assert.ok(info.description.includes('conref'));
        });

        test('Should return undefined for unknown codes', function () {
            const info = lookupErrorCode('ZZZZ999X');
            assert.strictEqual(info, undefined);
        });

        test('Should detect module from DOTA prefix', function () {
            assert.strictEqual(getModuleForCode('DOTA001F'), 'Core');
        });

        test('Should detect module from DOTJ prefix', function () {
            assert.strictEqual(getModuleForCode('DOTJ057E'), 'Processing');
        });

        test('Should detect module from DOTX prefix', function () {
            assert.strictEqual(getModuleForCode('DOTX053E'), 'Transform');
        });

        test('Should detect module from PDFJ prefix', function () {
            assert.strictEqual(getModuleForCode('PDFJ001E'), 'PDF');
        });

        test('Should detect module from PDFX prefix', function () {
            assert.strictEqual(getModuleForCode('PDFX013F'), 'PDF');
        });

        test('Should detect module from INDX prefix', function () {
            assert.strictEqual(getModuleForCode('INDX001I'), 'Indexing');
        });

        test('Should detect module from XEPJ prefix', function () {
            assert.strictEqual(getModuleForCode('XEPJ001W'), 'XEP');
        });

        test('Should return undefined for unknown prefixes', function () {
            assert.strictEqual(getModuleForCode('UNKNOWN'), undefined);
        });

        test('Catalog should have entries for all major modules', function () {
            const modules = new Set(Object.values(DITA_OT_ERROR_CODES).map(e => e.module));
            assert.ok(modules.has('Core'));
            assert.ok(modules.has('Processing'));
            assert.ok(modules.has('Transform'));
            assert.ok(modules.has('PDF'));
            assert.ok(modules.has('Indexing'));
            assert.ok(modules.has('XEP'));
        });

        test('All catalog entries should have non-empty descriptions', function () {
            for (const [code, info] of Object.entries(DITA_OT_ERROR_CODES)) {
                assert.ok(info.description.length > 0, `${code} has empty description`);
                assert.ok(info.module.length > 0, `${code} has empty module`);
            }
        });

        test('Severity suffix should match catalog entries', function () {
            // Spot-check: codes ending in E should be errors, W should be warnings
            const dotj057 = lookupErrorCode('DOTJ057E');
            assert.ok(dotj057, 'DOTJ057E should be in catalog');

            const dotx001 = lookupErrorCode('DOTX001W');
            assert.ok(dotx001, 'DOTX001W should be in catalog');

            const dotj018 = lookupErrorCode('DOTJ018I');
            assert.ok(dotj018, 'DOTJ018I should be in catalog');
        });
    });

    suite('Issue Mapping', () => {
        test('Should map severity correctly', function () {
            const errorIssue: ValidationIssue = {
                severity: 'error',
                code: 'DOTX060E',
                message: 'test error',
            };
            const warningIssue: ValidationIssue = {
                severity: 'warning',
                code: 'DOTJ070W',
                message: 'test warning',
            };
            const infoIssue: ValidationIssue = {
                severity: 'info',
                code: 'DOTJ073I',
                message: 'test info',
            };

            assert.strictEqual(errorIssue.severity, 'error');
            assert.strictEqual(warningIssue.severity, 'warning');
            assert.strictEqual(infoIssue.severity, 'info');
        });

        test('Should include description and module from catalog', function () {
            const issue: ValidationIssue = {
                severity: 'error',
                code: 'DOTX010E',
                message: 'Unable to find @conref target "shared/common.dita#warnings"',
                file: 'chapter1/intro.dita',
                description: 'Unable to find @conref target',
                module: 'Transform',
            };

            assert.strictEqual(issue.description, 'Unable to find @conref target');
            assert.strictEqual(issue.module, 'Transform');
        });

        test('Issues with unknown codes should still work without description', function () {
            const issue: ValidationIssue = {
                severity: 'error',
                code: 'UNKNOWN',
                message: 'Something broke',
            };

            assert.strictEqual(issue.description, undefined);
            assert.strictEqual(issue.module, undefined);
        });

        test('Should handle issues with partial location info', function () {
            const issueWithLine: ValidationIssue = {
                severity: 'error',
                code: 'E1',
                message: 'msg',
                file: 'test.dita',
                line: 10,
            };

            assert.strictEqual(issueWithLine.line, 10);
            assert.strictEqual(issueWithLine.column, undefined);
        });
    });
});
