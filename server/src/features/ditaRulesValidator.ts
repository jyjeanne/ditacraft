/**
 * Schematron-Equivalent DITA Rules Engine (Phase 6).
 * No XSLT or Schematron engine needed — rules operate on document text via regex.
 */

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import { t } from '../utils/i18n';
import { stripCommentsAndCDATA, offsetToRange } from '../utils/textUtils';
import { TAG_ATTRS } from '../utils/patterns';

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
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // role="other" must have @otherrole
            const regex = new RegExp(`<\\w+\\b(${TAG_ATTRS}\\brole\\s*=\\s*["']other["']${TAG_ATTRS})`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (!/\botherrole\s*=/.test(match[1])) {
                    const attr = findAttrInTag(match[0], 'role');
                    const offset = attr ? match.index + attr.offset : match.index;
                    const length = attr ? attr.length : match[0].length;
                    diagnostics.push(makeDiag(text, offset, length,
                        t('sch001.missingOtherrole'),
                        DiagnosticSeverity.Error, 'DITA-SCH-001'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-002',
        category: 'mandatory',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // <note type="other"> must have @othertype
            const regex = new RegExp(`<(\\w+)\\b(${TAG_ATTRS}\\btype\\s*=\\s*["']other["']${TAG_ATTRS})`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (!isNoteElement(match[1], match[2])) continue;
                if (!/\bothertype\s*=/.test(match[2])) {
                    const attr = findAttrInTag(match[0], 'type');
                    const offset = attr ? match.index + attr.offset : match.index;
                    const length = attr ? attr.length : match[0].length;
                    diagnostics.push(makeDiag(text, offset, length,
                        t('sch002.missingOthertype'),
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
                    t('sch003.deprecatedIndextermref'),
                    DiagnosticSeverity.Error, 'DITA-SCH-003'));
            }
        },
    },
    {
        id: 'DITA-SCH-004',
        category: 'mandatory',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // collection-type on reltable or relcolspec is not allowed
            const regex = new RegExp(`<(reltable|relcolspec)\\b(${TAG_ATTRS})`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\bcollection-type\s*=/.test(match[2])) {
                    const attr = findAttrInTag(match[0], 'collection-type');
                    const offset = attr ? match.index + attr.offset : match.index;
                    const length = attr ? attr.length : match[0].length;
                    diagnostics.push(makeDiag(text, offset, length,
                        t('sch004.collectionTypeNotAllowed', match[1]),
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
                    t('sch010.deprecatedBoolean'),
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
            const regex = new RegExp(`<image\\b(${TAG_ATTRS})`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\balt\s*=/.test(match[1])) {
                    const attr = findAttrInTag(match[0], 'alt');
                    const offset = attr ? match.index + attr.offset : match.index;
                    const length = attr ? attr.length : match[0].length;
                    diagnostics.push(makeDiag(text, offset, length,
                        t('sch011.deprecatedAltAttr'),
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
            const regex = new RegExp(`<image\\b(${TAG_ATTRS})`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\blongdescref\s*=/.test(match[1])) {
                    const attr = findAttrInTag(match[0], 'longdescref');
                    const offset = attr ? match.index + attr.offset : match.index;
                    const length = attr ? attr.length : match[0].length;
                    diagnostics.push(makeDiag(text, offset, length,
                        t('sch012.deprecatedLongdescref'),
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
            const regex = new RegExp(`<(link|topicref)\\b(${TAG_ATTRS})`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\bquery\s*=/.test(match[2])) {
                    const attr = findAttrInTag(match[0], 'query');
                    const offset = attr ? match.index + attr.offset : match.index;
                    const length = attr ? attr.length : match[0].length;
                    diagnostics.push(makeDiag(text, offset, length,
                        t('sch013.deprecatedQuery', match[1]),
                        DiagnosticSeverity.Warning, 'DITA-SCH-013'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-014',
        category: 'recommendation',
        versions: ['1.2', '1.3'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // Deprecated @navtitle attribute on topicref-like elements
            const regex = new RegExp(`<(\\w+)\\b(${TAG_ATTRS}\\bnavtitle\\s*=\\s*["'][^"']*["']${TAG_ATTRS})`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/^(?:topicref|chapter|appendix|part|keydef)$/.test(match[1])) {
                    const attr = findAttrInTag(match[0], 'navtitle');
                    const offset = attr ? match.index + attr.offset : match.index;
                    const length = attr ? attr.length : match[0].length;
                    diagnostics.push(makeDiag(text, offset, length,
                        t('sch014.deprecatedNavtitle'),
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
            const regex = new RegExp(`<map\\b(${TAG_ATTRS})`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\btitle\s*=/.test(match[1])) {
                    const attr = findAttrInTag(match[0], 'title');
                    const offset = attr ? match.index + attr.offset : match.index;
                    const length = attr ? attr.length : match[0].length;
                    diagnostics.push(makeDiag(text, offset, length,
                        t('sch015.deprecatedMapTitle'),
                        DiagnosticSeverity.Warning, 'DITA-SCH-015'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-016',
        category: 'recommendation',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <shortdesc> with more than 50 words
            const regex = new RegExp(`<shortdesc\\b${TAG_ATTRS}>([\\s\\S]*?)<\\/shortdesc>`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                const content = match[1].replace(new RegExp(`<(?:"[^"]*"|'[^']*'|[^>"'])+>`, 'g'), ''); // strip inner tags
                const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;
                if (wordCount > 50) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        t('sch016.longShortdesc', wordCount),
                        DiagnosticSeverity.Warning, 'DITA-SCH-016'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-017',
        category: 'recommendation',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <topichead> missing navtitle
            const regex = new RegExp(`<topichead\\b(${TAG_ATTRS})(?:\\/>|>([\\s\\S]*?)<\\/topichead>)`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                const attrs = match[1];
                const content = match[2] || '';
                const hasNavtitleAttr = /\bnavtitle\s*=/.test(attrs);
                const hasNavtitleElement = /<navtitle\b/.test(content)
                    || new RegExp(`<topicmeta\\b${TAG_ATTRS}>[\\s\\S]*?<navtitle\\b`).test(content);
                if (!hasNavtitleAttr && !hasNavtitleElement) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        t('sch017.topicheadMissingNavtitle'),
                        DiagnosticSeverity.Warning, 'DITA-SCH-017'));
                }
            }
        },
    },

    // --- AUTHORING RULES (warnings) ---

    {
        id: 'DITA-SCH-020',
        category: 'authoring',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <xref> inside <title>
            const regex = new RegExp(`<title\\b${TAG_ATTRS}>([\\s\\S]*?)<\\/title>`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                const titleContent = match[1];
                if (/<xref\b/.test(titleContent)) {
                    const xrefPos = match.index + match[0].indexOf('<xref');
                    diagnostics.push(makeDiag(text, xrefPos, 5,
                        t('sch020.xrefInTitle'),
                        DiagnosticSeverity.Warning, 'DITA-SCH-020'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-021',
        category: 'authoring',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <required-cleanup> present in document
            const regex = /<required-cleanup\b/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                diagnostics.push(makeDiag(text, match.index, match[0].length,
                    t('sch021.requiredCleanup'),
                    DiagnosticSeverity.Warning, 'DITA-SCH-021'));
            }
        },
    },
    {
        id: 'DITA-SCH-022',
        category: 'authoring',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
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
                            t('sch022.trademarkChar', name),
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
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // Multiple <title> in a <section> (only direct-child titles, not titles inside nested elements)
            const sectionRegex = new RegExp(`<section\\b${TAG_ATTRS}>([\\s\\S]*?)<\\/section>`, 'g');
            let match;
            while ((match = sectionRegex.exec(text)) !== null) {
                const titleCount = countDirectChildTitles(match[1]);
                if (titleCount > 1) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        t('sch023.multipleSectionTitles', titleCount),
                        DiagnosticSeverity.Warning, 'DITA-SCH-023'));
                }
            }
        },
    },

    // --- ACCESSIBILITY RULES (warnings) ---

    {
        id: 'DITA-SCH-030',
        category: 'accessibility',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <image> missing alt text (<alt> element or @alt attribute)
            const regex = new RegExp(`<image\\b(${TAG_ATTRS})(?:\\/>|>([\\s\\S]*?)<\\/image>)`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                const attrs = match[1];
                const content = match[2] || '';
                const hasAltAttr = /\balt\s*=/.test(attrs);
                const hasAltElement = /<alt\b/.test(content);
                if (!hasAltAttr && !hasAltElement) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        t('sch030.imageMissingAlt'),
                        DiagnosticSeverity.Warning, 'DITA-SCH-030'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-031',
        category: 'accessibility',
        versions: ['1.0', '1.1', '1.2', '1.3'],  // object removed in 2.0 — see SCH-052
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <object> missing <desc> element
            const regex = new RegExp(`<object\\b${TAG_ATTRS}>([\\s\\S]*?)<\\/object>`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (!/<desc\b/.test(match[1])) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        t('sch031.objectMissingDesc'),
                        DiagnosticSeverity.Warning, 'DITA-SCH-031'));
                }
            }
        },
    },

    // --- NEW RULES (from dita-language-server's dita.sch) ---

    {
        id: 'DITA-SCH-040',
        category: 'mandatory',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // <xref> must not nest another <xref> (skip self-closing <xref .../>)
            const regex = new RegExp(`<xref\\b${TAG_ATTRS}(?<!\\/)>([\\s\\S]*?)<\\/xref>`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                const inner = match[1];
                const nestedXref = /<xref\b/.exec(inner);
                if (nestedXref) {
                    // Content starts right after the opening tag's >
                    const contentStart = match.index + match[0].indexOf('>') + 1;
                    diagnostics.push(makeDiag(text, contentStart + nestedXref.index, 5,
                        t('sch040.nestedXref'),
                        DiagnosticSeverity.Error, 'DITA-SCH-040'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-041',
        category: 'recommendation',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <pre> should not contain <image>, <object>, <sup>, or <sub>
            const regex = new RegExp(`<pre\\b${TAG_ATTRS}>([\\s\\S]*?)<\\/pre>`, 'g');
            const forbidden = /<(image|object|sup|sub)\b/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                const inner = match[1];
                // Content starts right after the opening tag's >
                const contentStart = match.index + match[0].indexOf('>') + 1;
                forbidden.lastIndex = 0;
                let fMatch;
                while ((fMatch = forbidden.exec(inner)) !== null) {
                    diagnostics.push(makeDiag(text, contentStart + fMatch.index, fMatch[0].length,
                        t('sch041.forbiddenInPre', fMatch[1]),
                        DiagnosticSeverity.Warning, 'DITA-SCH-041'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-042',
        category: 'recommendation',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Information,
        check(text, diagnostics) {
            // <abstract> should contain <shortdesc>
            const regex = new RegExp(`<abstract\\b${TAG_ATTRS}>([\\s\\S]*?)<\\/abstract>`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (!/<shortdesc\b/.test(match[1])) {
                    diagnostics.push(makeDiag(text, match.index, '<abstract'.length,
                        t('sch042.abstractMissingShortdesc'),
                        DiagnosticSeverity.Information, 'DITA-SCH-042'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-043',
        category: 'authoring',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Information,
        check(text, diagnostics) {
            // <no-topic-nesting> is a placeholder — has no output processing
            const regex = /<no-topic-nesting\b/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                diagnostics.push(makeDiag(text, match.index, match[0].length,
                    t('sch043.noTopicNesting'),
                    DiagnosticSeverity.Information, 'DITA-SCH-043'));
            }
        },
    },
    {
        id: 'DITA-SCH-044',
        category: 'recommendation',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // Deprecated role values "sample" and "external"
            const regex = /\brole\s*=\s*["'](sample|external)["']/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                diagnostics.push(makeDiag(text, match.index, match[0].length,
                    t('sch044.deprecatedRoleValue', match[1]),
                    DiagnosticSeverity.Warning, 'DITA-SCH-044'));
            }
        },
    },
    {
        id: 'DITA-SCH-045',
        category: 'authoring',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Information,
        check(text, diagnostics) {
            // Single-paragraph body → consider using shortdesc instead
            const bodyRegex = new RegExp(`<(?:body|conbody)\\b${TAG_ATTRS}>([\\s\\S]*?)<\\/(?:body|conbody)>`, 'g');
            let match;
            while ((match = bodyRegex.exec(text)) !== null) {
                const inner = match[1].trim();
                // Check: only one <p> and no other block elements
                const pCount = (inner.match(/<p\b/g) || []).length;
                const otherBlocks = inner.match(/<(?:ul|ol|dl|sl|table|simpletable|fig|section|example|note|codeblock|pre|image|object)\b/g);
                if (pCount === 1 && !otherBlocks) {
                    // Highlight just the opening tag name (e.g., <body or <conbody)
                    const tagNameMatch = match[0].match(/<(\w+)/);
                    const tagLen = tagNameMatch ? tagNameMatch[0].length : 5;
                    diagnostics.push(makeDiag(text, match.index, tagLen,
                        t('sch045.singleParagraphBody'),
                        DiagnosticSeverity.Information, 'DITA-SCH-045'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-046',
        category: 'recommendation',
        versions: ['1.0', '1.1', '1.2', '1.3', '2.0'],
        severity: DiagnosticSeverity.Information,
        check(text, diagnostics) {
            // Elements with <title> child should have an @id attribute
            const regex = new RegExp(`<(section|example|fig|table|simpletable)\\b(${TAG_ATTRS})>`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                const attrs = match[2];
                if (/\bid\s*=/.test(attrs)) continue;
                // Check if this element contains a <title> child
                const closeTag = `</${match[1]}>`;
                const closeIdx = text.indexOf(closeTag, match.index + match[0].length);
                if (closeIdx === -1) continue;
                const inner = text.substring(match.index + match[0].length, closeIdx);
                if (/<title\b/.test(inner)) {
                    diagnostics.push(makeDiag(text, match.index, match[0].length,
                        t('sch046.idlessTitledElement', match[1]),
                        DiagnosticSeverity.Information, 'DITA-SCH-046'));
                }
            }
        },
    },
    // --- DITA 2.0-SPECIFIC RULES ---

    {
        id: 'DITA-SCH-050',
        category: 'mandatory',
        versions: ['2.0'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // <boolean> removed in DITA 2.0
            const regex = /<boolean\b/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                diagnostics.push(makeDiag(text, match.index, match[0].length,
                    t('sch050.removedBoolean'),
                    DiagnosticSeverity.Error, 'DITA-SCH-050'));
            }
        },
    },
    {
        id: 'DITA-SCH-051',
        category: 'mandatory',
        versions: ['2.0'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // <indextermref> removed in DITA 2.0
            const regex = /<indextermref\b/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                diagnostics.push(makeDiag(text, match.index, match[0].length,
                    t('sch051.removedIndextermref'),
                    DiagnosticSeverity.Error, 'DITA-SCH-051'));
            }
        },
    },
    {
        id: 'DITA-SCH-052',
        category: 'mandatory',
        versions: ['2.0'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // <object> removed in DITA 2.0 — use <audio>, <video>, or <include>
            const regex = /<object\b/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                diagnostics.push(makeDiag(text, match.index, match[0].length,
                    t('sch052.removedObject'),
                    DiagnosticSeverity.Error, 'DITA-SCH-052'));
            }
        },
    },
    {
        id: 'DITA-SCH-053',
        category: 'mandatory',
        versions: ['2.0'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // Learning specializations removed in DITA 2.0
            const regex = /<(learningOverview|learningContent|learningSummary|learningAssessment|learningPlan|learningMap|learningBookmap)\b/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                diagnostics.push(makeDiag(text, match.index, match[0].length,
                    t('sch053.removedLearning', match[1]),
                    DiagnosticSeverity.Error, 'DITA-SCH-053'));
            }
        },
    },
    {
        id: 'DITA-SCH-054',
        category: 'accessibility',
        versions: ['2.0'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <audio> should have a <fallback> child for accessibility
            const regex = new RegExp(`<audio\\b${TAG_ATTRS}>([\\s\\S]*?)<\\/audio>`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (!/<fallback\b/.test(match[1])) {
                    diagnostics.push(makeDiag(text, match.index, '<audio'.length,
                        t('sch054.audioMissingFallback'),
                        DiagnosticSeverity.Warning, 'DITA-SCH-054'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-055',
        category: 'accessibility',
        versions: ['2.0'],
        severity: DiagnosticSeverity.Warning,
        check(text, diagnostics) {
            // <video> should have a <fallback> child for accessibility
            const regex = new RegExp(`<video\\b${TAG_ATTRS}>([\\s\\S]*?)<\\/video>`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (!/<fallback\b/.test(match[1])) {
                    diagnostics.push(makeDiag(text, match.index, '<video'.length,
                        t('sch055.videoMissingFallback'),
                        DiagnosticSeverity.Warning, 'DITA-SCH-055'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-056',
        category: 'mandatory',
        versions: ['2.0'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // @print attribute removed in DITA 2.0
            const regex = new RegExp(`<(\\w+)\\b(${TAG_ATTRS})`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\bprint\s*=/.test(match[2])) {
                    const attr = findAttrInTag(match[0], 'print');
                    const offset = attr ? match.index + attr.offset : match.index;
                    const length = attr ? attr.length : match[0].length;
                    diagnostics.push(makeDiag(text, offset, length,
                        t('sch056.removedPrint'),
                        DiagnosticSeverity.Error, 'DITA-SCH-056'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-057',
        category: 'mandatory',
        versions: ['2.0'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // @copy-to attribute removed in DITA 2.0
            const regex = new RegExp(`<(\\w+)\\b(${TAG_ATTRS})`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\bcopy-to\s*=/.test(match[2])) {
                    const attr = findAttrInTag(match[0], 'copy-to');
                    const offset = attr ? match.index + attr.offset : match.index;
                    const length = attr ? attr.length : match[0].length;
                    diagnostics.push(makeDiag(text, offset, length,
                        t('sch057.removedCopyTo'),
                        DiagnosticSeverity.Error, 'DITA-SCH-057'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-058',
        category: 'mandatory',
        versions: ['2.0'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // @navtitle attribute removed in DITA 2.0 (was deprecated since 1.2)
            const regex = new RegExp(`<(\\w+)\\b(${TAG_ATTRS}\\bnavtitle\\s*=\\s*["'][^"']*["']${TAG_ATTRS})`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/^(?:topicref|chapter|appendix|part|keydef|topichead)$/.test(match[1])) {
                    const attr = findAttrInTag(match[0], 'navtitle');
                    const offset = attr ? match.index + attr.offset : match.index;
                    const length = attr ? attr.length : match[0].length;
                    diagnostics.push(makeDiag(text, offset, length,
                        t('sch058.removedNavtitle'),
                        DiagnosticSeverity.Error, 'DITA-SCH-058'));
                }
            }
        },
    },
    {
        id: 'DITA-SCH-059',
        category: 'mandatory',
        versions: ['2.0'],
        severity: DiagnosticSeverity.Error,
        check(text, diagnostics) {
            // @query attribute removed in DITA 2.0
            const regex = new RegExp(`<(link|topicref)\\b(${TAG_ATTRS})`, 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                if (/\bquery\s*=/.test(match[2])) {
                    const attr = findAttrInTag(match[0], 'query');
                    const offset = attr ? match.index + attr.offset : match.index;
                    const length = attr ? attr.length : match[0].length;
                    diagnostics.push(makeDiag(text, offset, length,
                        t('sch059.removedQuery', match[1]),
                        DiagnosticSeverity.Error, 'DITA-SCH-059'));
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


/**
 * Count <title> elements that are direct children of the given content.
 * Uses depth tracking: only titles at depth 0 are counted.
 * Depth increases on any opening tag (except self-closing) and decreases on closing tags.
 */
function countDirectChildTitles(content: string): number {
    let count = 0;
    let depth = 0;
    // Match opening tags, closing tags, and self-closing tags
    const tagRegex = /<(\/?)(\w+)\b(?:"[^"]*"|'[^']*'|[^>"'])*(\/?)>/g;
    let m;
    while ((m = tagRegex.exec(content)) !== null) {
        const isClosing = m[1] === '/';
        const tagName = m[2];
        const isSelfClosing = m[3] === '/';

        if (isSelfClosing) {
            // Self-closing tags don't change depth
            // But check if it's a self-closing <title/> at depth 0
            if (tagName === 'title' && depth === 0) {
                count++;
            }
            continue;
        }

        if (isClosing) {
            depth--;
        } else {
            // Opening tag
            if (tagName === 'title' && depth === 0) {
                count++;
            }
            depth++;
        }
    }
    return count;
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

/**
 * Find a specific attribute within a matched tag text.
 * Returns { offset, length } relative to the start of tagText,
 * covering the full `attrName="value"` or just `attrName=` if no quotes found.
 * Returns null if the attribute is not found.
 */
function findAttrInTag(tagText: string, attrName: string): { offset: number; length: number } | null {
    const regex = new RegExp(`\\b${attrName}\\s*=\\s*(?:["'][^"']*["']|\\S+)`);
    const match = regex.exec(tagText);
    if (!match) return null;
    return { offset: match.index, length: match[0].length };
}
