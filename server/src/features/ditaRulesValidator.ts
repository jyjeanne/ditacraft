/**
 * Schematron-Equivalent DITA Rules Engine (Phase 6).
 * No XSLT or Schematron engine needed — rules operate on document text via regex.
 */

import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';

const SOURCE = 'dita-rules';

/** DITA version type. */
export type DitaVersion = '1.0' | '1.1' | '1.2' | '1.3' | '2.0' | 'unknown';

/** Rule category for configuration filtering. */
export type RuleCategory = 'mandatory' | 'recommendation' | 'authoring' | 'accessibility';

/** A single DITA validation rule. */
interface DitaRule {
    id: string;
    category: RuleCategory;
    versions: DitaVersion[];
    severity: DiagnosticSeverity;
    /** text is cleaned (comments/CDATA replaced with spaces, offsets preserved). */
    check: (text: string, diagnostics: Diagnostic[]) => void;
}

// ============================
//  RULE DEFINITIONS
// ============================

const DITA_RULES: DitaRule[] = [

    // --- MANDATORY RULES (errors) ---

    {
        id: 'DITA-SCH-001',
        category: 'mandatory',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // role="other" must have @otherrole
            const regex = /<\w+\b([^>]*\brole\s*=\s*["']other["'][^>]*)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (!/\botherrole\s*=/.test(match[1])) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        'When role="other", the otherrole attribute is required.',
                        DiagnosticSeverity.Error, 'DITA-SCH-001'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-002',
        category: 'mandatory',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // <note type="other"> must have @othertype
            const regex = /<(\w+)\b([^>]*\btype\s*=\s*["']other["'][^>]*)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (!isNoteElement(match[1], match[2])) continue;
                if (!/\bothertype\s*=/.test(match[2])) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        'When note type="other", the othertype attribute is required.',
                        DiagnosticSeverity.Error, 'DITA-SCH-002'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-003',
        category: 'mandatory',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // Deprecated <indextermref> element
            const regex = /<indextermref\b/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                diagnostics.push(makeDiag(text, match.index, match[0].length,
                    'The <indextermref> element is deprecated.',
                    DiagnosticSeverity.Error, 'DITA-SCH-003'));
            }
        },
    },
    {
        id: 'DITA-SCH-004',
        category: 'mandatory',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // collection-type on reltable or relcolspec is not allowed
            const regex = /<(reltable|relcolspec)\b([^>]*)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\bcollection-type\s*=/.test(match[2])) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        `The collection-type attribute is not allowed on <${match[1]}>.`,
                        DiagnosticSeverity.Error, 'DITA-SCH-004'));
                }
            }
        },
    },

    // --- RECOMMENDATION RULES (warnings) ---

    {
        id: 'DITA-SCH-010',
        category: 'recommendation',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // Deprecated <boolean> element
            const regex = /<boolean\b/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                diagnostics.push(makeDiag(text, match.index, match[0].length,
                    'The <boolean> element is deprecated. Use <state> with value="yes" or "no" instead.',
                    DiagnosticSeverity.Warning, 'DITA-SCH-010'));
            }
        },
    },
    {
        id: 'DITA-SCH-011',
        category: 'recommendation',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <image> with deprecated @alt attribute
            const regex = /<image\b([^>]*)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\balt\s*=/.test(match[1])) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        'The alt attribute on <image> is deprecated. Use the <alt> child element instead.',
                        DiagnosticSeverity.Warning, 'DITA-SCH-011'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-012',
        category: 'recommendation',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // Deprecated @longdescref attribute on <image>
            const regex = /<image\b([^>]*)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\blongdescref\s*=/.test(match[1])) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        'The longdescref attribute is deprecated. Use the <longdescref> element instead.',
                        DiagnosticSeverity.Warning, 'DITA-SCH-012'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-013',
        category: 'recommendation',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // Deprecated @query attribute on <link> and <topicref>
            const regex = /<(link|topicref)\b([^>]*)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\bquery\s*=/.test(match[2])) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        `The query attribute on <${match[1]}> is deprecated.`,
                        DiagnosticSeverity.Warning, 'DITA-SCH-013'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-014',
        category: 'recommendation',
        versions: ['1.2'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // Deprecated @navtitle attribute on topicref-like elements
            const regex = /<(\w+)\b([^>]*\bnavtitle\s*=\s*["'][^"']*["'][^>]*)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/^(?:topicref|chapter|appendix|part|keydef)$/.test(match[1])) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        'The navtitle attribute is deprecated. Use <navtitle> inside <topicmeta> instead.',
                        DiagnosticSeverity.Warning, 'DITA-SCH-014'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-015',
        category: 'recommendation',
        versions: ['1.1', '1.2'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // Deprecated @title attribute on <map>
            const regex = /<map\b([^>]*)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\btitle\s*=/.test(match[1])) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        'The title attribute on <map> is deprecated. Use the <title> element instead.',
                        DiagnosticSeverity.Warning, 'DITA-SCH-015'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-016',
        category: 'recommendation',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <shortdesc> with more than 50 words
            const regex = /<shortdesc\b[^>]*>([\s\S]*?)<\/shortdesc>/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                const content = match[1].replace(/<[^>]+>/g, ''); // strip inner tags
                const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
                if (wordCount >= 50) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        `Short description has ${wordCount} words. Consider keeping it under 50 words.`,
                        DiagnosticSeverity.Warning, 'DITA-SCH-016'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-017',
        category: 'recommendation',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <topichead> missing navtitle
            const regex = /<topichead\b([^>]*?)(?:\/>|>([\s\S]*?)<\/topichead>)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                const attrs = match[1];
                const content = match[2] || '';
                const hasNavtitleAttr = /\bnavtitle\s*=/.test(attrs);
                const hasNavtitleElement = /<navtitle\b/.test(content)
                    || /<topicmeta\b[^>]*>[\s\S]*?<navtitle\b/.test(content);
                if (!hasNavtitleAttr && !hasNavtitleElement) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        'The <topichead> element should have a navigation title.',
                        DiagnosticSeverity.Warning, 'DITA-SCH-017'));
                }
            }
        },
    },

    // --- AUTHORING RULES (warnings) ---

    {
        id: 'DITA-SCH-020',
        category: 'authoring',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <xref> inside <title>
            const regex = /<title\b[^>]*>([\s\S]*?)<\/title>/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                const titleContent = match[1];
                if (/<xref\b/.test(titleContent)) {
                    const xrefPos = match.index + match[0].indexOf('<xref');
                    diagnostics.push(makeDiag(text, xrefPos, 5,
                        'Using <xref> in <title> is ill-advised because titles are often used as links.',
                        DiagnosticSeverity.Warning, 'DITA-SCH-020'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-021',
        category: 'authoring',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <required-cleanup> present in document
            const regex = /<required-cleanup\b/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                diagnostics.push(makeDiag(text, match.index, match[0].length,
                    'The <required-cleanup> element indicates content that must be cleaned up before publishing.',
                    DiagnosticSeverity.Warning, 'DITA-SCH-021'));
            }
        },
    },
    {
        id: 'DITA-SCH-022',
        category: 'authoring',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // Trademark characters used as plain text instead of <tm>
            const tmChars: { char: string; name: string }[] = [
                { char: '\u2122', name: 'trademark (\u2122)' },
                { char: '\u2120', name: 'service mark (\u2120)' },
                { char: '\u00AE', name: 'registered (\u00AE)' },
            ];
            for (const { char, name } of tmChars) {
                let pos = text.indexOf(char);
                while (pos !== -1) {
                    if (!isInsideTag(text, pos)) {
                        diagnostics.push(makeDiag(text, pos, 1,
                            `The ${name} character should be represented using the <tm> element.`,
                            DiagnosticSeverity.Warning, 'DITA-SCH-022'));
                    }
                    pos = text.indexOf(char, pos + 1);
                }
            }
        },
    },
    {
        id: 'DITA-SCH-023',
        category: 'authoring',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // Multiple <title> in a <section>
            const sectionRegex = /<section\b[^>]*>([\s\S]*?)<\/section>/g;
            let match;
            while ((match = sectionRegex.exec(text)) !== null) {
                const sectionContent = match[1];
                const titleCount = (sectionContent.match(/<title\b/g) || []).length;
                if (titleCount > 1) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        `Section has ${titleCount} <title> elements. Only one is allowed.`,
                        DiagnosticSeverity.Warning, 'DITA-SCH-023'));
                }
            }
        },
    },

    // --- ACCESSIBILITY RULES (warnings) ---

    {
        id: 'DITA-SCH-030',
        category: 'accessibility',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <image> missing alt text (<alt> element or @alt attribute)
            const regex = /<image\b([^>]*?)(?:\/>|>([\s\S]*?)<\/image>)/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                const attrs = match[1];
                const content = match[2] || '';
                const hasAltAttr = /\balt\s*=/.test(attrs);
                const hasAltElement = /<alt\b/.test(content);
                if (!hasAltAttr && !hasAltElement) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        'Image is missing alternative text. Add an <alt> element or alt attribute for accessibility.',
                        DiagnosticSeverity.Warning, 'DITA-SCH-030'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-031',
        category: 'accessibility',
        versions: ['1.0', '1.1', '1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <object> missing <desc> element
            const regex = /<object\b[^>]*>([\s\S]*?)<\/object>/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (!/<desc\b/.test(match[1])) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        'Object is missing a <desc> element for accessibility.',
                        DiagnosticSeverity.Warning, 'DITA-SCH-031'));
                }
            }
        },
    },
];

// ============================
//  Public API
// ============================

export interface DitaRulesSettings {
    enabled: boolean;
    categories: RuleCategory[];
    ditaVersion: DitaVersion;
}

const DEFAULT_SETTINGS: DitaRulesSettings = {
    enabled: true,
    categories: ['mandatory', 'recommendation', 'authoring', 'accessibility'],
    ditaVersion: '1.3',
};

/**
 * Run all applicable DITA rules against a document.
 */
export function validateDitaRules(
    text: string,
    settings: DitaRulesSettings = DEFAULT_SETTINGS
): Diagnostic[] {
    if (!settings.enabled) return [];

    // Strip comments and CDATA so rules don't fire on commented-out content.
    // Offsets are preserved (non-newline chars replaced with spaces).
    const cleanText = stripCommentsAndCDATA(text);

    const diagnostics: Diagnostic[] = [];
    const version = settings.ditaVersion;

    for (const rule of DITA_RULES) {
        if (!rule.versions.includes(version)) continue;
        if (!settings.categories.includes(rule.category)) continue;
        rule.check(cleanText, diagnostics);
    }

    return diagnostics;
}

// ============================
//  Helper functions
// ============================

function makeDiag(
    text: string, offset: number, length: number,
    message: string, severity: DiagnosticSeverity, code: string
): Diagnostic {
    return {
        range: offsetToRange(text, offset, offset + length),
        message,
        severity,
        code,
        source: SOURCE,
    };
}

/** Handles \r\n correctly. */
function offsetToRange(text: string, start: number, end: number): Range {
    let line = 0;
    let char = 0;
    let startLine = 0;
    let startChar = 0;
    let endLine = 0;
    let endChar = 0;

    const safeStart = Math.min(start, text.length);
    const safeEnd = Math.min(end, text.length);

    for (let i = 0; i <= safeEnd; i++) {
        if (i === safeStart) { startLine = line; startChar = char; }
        if (i === safeEnd) { endLine = line; endChar = char; break; }
        if (text[i] === '\r') {
            line++;
            char = 0;
            if (i + 1 <= safeEnd && text[i + 1] === '\n') {
                i++;
                if (i === safeStart) { startLine = line; startChar = char; }
                if (i === safeEnd) { endLine = line; endChar = char; break; }
            }
        } else if (text[i] === '\n') {
            line++;
            char = 0;
        } else {
            char++;
        }
    }

    return {
        start: { line: startLine, character: startChar },
        end: { line: endLine, character: endChar },
    };
}

/** Strip XML comments and CDATA sections, preserving offsets (non-newline chars → spaces). */
function stripCommentsAndCDATA(text: string): string {
    return text
        .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n\r]/g, ' '))
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (m) => m.replace(/[^\n\r]/g, ' '));
}

function isInsideTag(text: string, pos: number): boolean {
    const lastOpen = text.lastIndexOf('<', pos);
    const lastClose = text.lastIndexOf('>', pos);
    return lastOpen > lastClose;
}

function isNoteElement(tagName: string, attrs: string): boolean {
    if (/\bclass\s*=\s*["'][^"']*\btopic\/note\b/.test(attrs)) return true;
    return tagName === 'note';
}
