import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { validateCustomRules, clearCustomRulesCache } from '../src/features/customRulesValidator';

suite('Custom Rules Validator', () => {

    let tmpDir: string;

    setup(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-custom-'));
        clearCustomRulesCache();
    });

    teardown(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    function writeRulesFile(rules: object[]): string {
        const filePath = path.join(tmpDir, 'rules.json');
        fs.writeFileSync(filePath, JSON.stringify({ rules }), 'utf-8');
        return filePath;
    }

    test('matches a simple pattern and produces diagnostic', () => {
        const rulesFile = writeRulesFile([{
            id: 'ORG-001',
            pattern: 'FooBar',
            severity: 'warning',
            message: 'Do not use FooBar',
        }]);
        const text = '<topic id="t1"><title>FooBar usage</title><body><p>FooBar is bad</p></body></topic>';
        const diags = validateCustomRules(text, '/test.dita', rulesFile, 100);
        assert.strictEqual(diags.length, 2, 'should find 2 occurrences of FooBar');
        assert.strictEqual(diags[0].code, 'ORG-001');
        assert.strictEqual(diags[0].message, 'Do not use FooBar');
        assert.strictEqual(diags[0].severity, 2); // Warning
    });

    test('respects fileTypes filter', () => {
        const rulesFile = writeRulesFile([{
            id: 'ORG-002',
            pattern: 'TestPattern',
            severity: 'error',
            message: 'Not allowed in concepts',
            fileTypes: ['concept'],
        }]);
        // topic content — rule should not match
        const topicText = '<topic id="t1"><title>T</title><body><p>TestPattern here</p></body></topic>';
        const diags1 = validateCustomRules(topicText, '/test.dita', rulesFile, 100);
        assert.strictEqual(diags1.length, 0, 'should not match in topic files');

        clearCustomRulesCache();
        // concept content — rule should match
        const conceptText = '<concept id="c1"><title>C</title><conbody><p>TestPattern here</p></conbody></concept>';
        const diags2 = validateCustomRules(conceptText, '/test.dita', rulesFile, 100);
        assert.strictEqual(diags2.length, 1, 'should match in concept files');
    });

    test('skips rules with invalid regex', () => {
        const rulesFile = writeRulesFile([
            { id: 'BAD-001', pattern: '(unclosed', severity: 'warning', message: 'bad regex' },
            { id: 'GOOD-001', pattern: 'GoodMatch', severity: 'warning', message: 'found it' },
        ]);
        const text = '<topic id="t1"><title>GoodMatch</title><body><p>text</p></body></topic>';
        const diags = validateCustomRules(text, '/test.dita', rulesFile, 100);
        assert.strictEqual(diags.length, 1, 'should skip bad regex and still find good match');
        assert.strictEqual(diags[0].code, 'GOOD-001');
    });

    test('returns empty when rules file does not exist', () => {
        const diags = validateCustomRules(
            '<topic id="t1"><title>T</title></topic>',
            '/test.dita',
            '/nonexistent/rules.json',
            100,
        );
        assert.strictEqual(diags.length, 0);
    });

    test('returns empty when rules file is empty string', () => {
        const diags = validateCustomRules(
            '<topic id="t1"><title>T</title></topic>',
            '/test.dita',
            '',
            100,
        );
        assert.strictEqual(diags.length, 0);
    });

    test('respects maxProblems limit', () => {
        const rulesFile = writeRulesFile([{
            id: 'ORG-003',
            pattern: 'x',
            severity: 'information',
            message: 'found x',
        }]);
        const text = '<topic id="t1"><title>xxxxxxxxxx</title><body><p>text</p></body></topic>';
        const diags = validateCustomRules(text, '/test.dita', rulesFile, 3);
        assert.strictEqual(diags.length, 3, 'should cap at maxProblems');
    });

    test('ignores matches inside comments', () => {
        const rulesFile = writeRulesFile([{
            id: 'ORG-004',
            pattern: 'SecretWord',
            severity: 'warning',
            message: 'found it',
        }]);
        const text = '<topic id="t1"><title>T</title><body><!-- SecretWord --><p>text</p></body></topic>';
        const diags = validateCustomRules(text, '/test.dita', rulesFile, 100);
        assert.strictEqual(diags.length, 0, 'should not match inside comments');
    });

    test('maps severity names correctly', () => {
        const rulesFile = writeRulesFile([
            { id: 'SEV-001', pattern: 'AAA', severity: 'error', message: 'm' },
            { id: 'SEV-002', pattern: 'BBB', severity: 'warning', message: 'm' },
            { id: 'SEV-003', pattern: 'CCC', severity: 'information', message: 'm' },
            { id: 'SEV-004', pattern: 'DDD', severity: 'hint', message: 'm' },
        ]);
        const text = '<topic id="t1"><title>AAA BBB CCC DDD</title><body><p>t</p></body></topic>';
        const diags = validateCustomRules(text, '/test.dita', rulesFile, 100);
        assert.strictEqual(diags.find(d => d.code === 'SEV-001')?.severity, 1); // Error
        assert.strictEqual(diags.find(d => d.code === 'SEV-002')?.severity, 2); // Warning
        assert.strictEqual(diags.find(d => d.code === 'SEV-003')?.severity, 3); // Information
        assert.strictEqual(diags.find(d => d.code === 'SEV-004')?.severity, 4); // Hint
    });

    test('detects bookmap file type from content', () => {
        const rulesFile = writeRulesFile([{
            id: 'MAP-001',
            pattern: 'SomeText',
            severity: 'warning',
            message: 'found',
            fileTypes: ['bookmap'],
        }]);
        const text = '<bookmap id="b1"><booktitle><mainbooktitle>SomeText</mainbooktitle></booktitle></bookmap>';
        const diags = validateCustomRules(text, '/test.ditamap', rulesFile, 100);
        assert.strictEqual(diags.length, 1, 'should match bookmap file type');
    });

    test('caches rules and uses mtime for invalidation', () => {
        const rulesFile = writeRulesFile([{
            id: 'CACHE-001',
            pattern: 'Hello',
            severity: 'warning',
            message: 'found',
        }]);
        const text = '<topic id="t1"><title>Hello</title><body><p>t</p></body></topic>';

        // First call — loads from file
        const diags1 = validateCustomRules(text, '/test.dita', rulesFile, 100);
        assert.strictEqual(diags1.length, 1);

        // Second call — should use cache (same mtime)
        const diags2 = validateCustomRules(text, '/test.dita', rulesFile, 100);
        assert.strictEqual(diags2.length, 1);

        // Update file — should reload
        fs.writeFileSync(rulesFile, JSON.stringify({
            rules: [{ id: 'CACHE-002', pattern: 'Hello', severity: 'error', message: 'updated' }],
        }));
        // Touch file to ensure different mtime
        const now = new Date();
        fs.utimesSync(rulesFile, now, now);

        // No clearCustomRulesCache() here — validate that mtime change triggers reload
        const diags3 = validateCustomRules(text, '/test.dita', rulesFile, 100);
        assert.strictEqual(diags3.length, 1);
        assert.strictEqual(diags3[0].code, 'CACHE-002');
    });

    // -----------------------------------------------------------------------
    // Additional edge cases from Manual Test Plan §4.9
    // -----------------------------------------------------------------------

    test('invalid JSON in rules file returns empty, no crash', () => {
        const rulesFile = path.join(tmpDir, 'bad.json');
        fs.writeFileSync(rulesFile, '{ this is not valid json }', 'utf-8');
        const text = '<topic id="t1"><title>T</title><body><p>text</p></body></topic>';
        const diags = validateCustomRules(text, '/test.dita', rulesFile, 100);
        assert.strictEqual(diags.length, 0, 'invalid JSON should return empty array');
    });

    test('rules file with empty rules array returns empty', () => {
        const rulesFile = path.join(tmpDir, 'empty-rules.json');
        fs.writeFileSync(rulesFile, JSON.stringify({ rules: [] }), 'utf-8');
        const text = '<topic id="t1"><title>FooBar</title><body><p>text</p></body></topic>';
        const diags = validateCustomRules(text, '/test.dita', rulesFile, 100);
        assert.strictEqual(diags.length, 0);
    });

    test('complex regex with character class matches correctly', () => {
        const rulesFile = writeRulesFile([{
            id: 'REGEX-001',
            pattern: '[A-Z]{3,}',
            severity: 'warning',
            message: 'Avoid all-caps words',
        }]);
        const text = '<topic id="t1"><title>THIS IS LOUD</title><body><p>normal text</p></body></topic>';
        const diags = validateCustomRules(text, '/test.dita', rulesFile, 100);
        assert.ok(diags.length > 0, 'character class regex should match');
        assert.strictEqual(diags[0].code, 'REGEX-001');
    });

    test('regex with alternation matches correctly', () => {
        const rulesFile = writeRulesFile([{
            id: 'ALT-001',
            pattern: '(TODO|FIXME|HACK)',
            severity: 'information',
            message: 'Found work-in-progress marker',
        }]);
        const text = '<topic id="t1"><title>T</title><body><p>TODO fix this HACK</p></body></topic>';
        const diags = validateCustomRules(text, '/test.dita', rulesFile, 100);
        assert.strictEqual(diags.length, 2, 'should find both TODO and HACK');
    });

    test('rule with missing required fields is gracefully skipped', () => {
        const rulesFile = path.join(tmpDir, 'incomplete.json');
        fs.writeFileSync(rulesFile, JSON.stringify({
            rules: [
                { id: 'INCOMPLETE', message: 'missing pattern field' },
                { id: 'GOOD-001', pattern: 'Match', severity: 'warning', message: 'found' },
            ],
        }), 'utf-8');
        const text = '<topic id="t1"><title>Match this</title><body><p>text</p></body></topic>';
        const diags = validateCustomRules(text, '/test.dita', rulesFile, 100);
        assert.ok(diags.some(d => d.code === 'GOOD-001'), 'valid rule should still match');
    });
});
