/**
 * DITA Content Model Validator (Server-Side)
 *
 * Validates DITA documents against element content models.
 * Provides DTD-like validation without requiring native DTD bindings.
 * Based on DITA 1.3 DTD specifications.
 *
 * Ported from client-side ditaContentModelValidator.ts to run in the
 * LSP server validation pipeline. Runs as Phase 4 (after structure
 * validation, before DTD/RNG). Skipped when TypesXML is active
 * since DTD validation already covers content models.
 */

import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver/node';

// ---------------------------------------------------------------------------
// Content model definitions
// ---------------------------------------------------------------------------

interface ContentModel {
    allowedChildren: string[];
    requiredChildren?: string[];
    requiredAttributes?: string[];
    disallowedChildren?: string[];
    description?: string;
}

const DITA_CONTENT_MODELS: Record<string, ContentModel> = {
    // Map elements
    'map': {
        allowedChildren: [
            'title', 'topicmeta', 'anchor', 'data', 'data-about',
            'navref', 'reltable', 'topicref', 'mapref', 'keydef',
            'topicgroup', 'topichead', 'topicset', 'topicsetref',
            'anchorref', 'ditavalref', 'glossref',
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'msgblock',
            'lines', 'lq', 'note', 'hazardstatement', 'image', 'object',
            'fig', 'table', 'simpletable', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'concept', 'task', 'reference',
        ],
        description: 'Map elements can only contain map-level children (topicref, reltable, etc.), not topic content elements',
    },
    'topicref': {
        allowedChildren: [
            'topicmeta', 'topicref', 'mapref', 'keydef', 'topicgroup',
            'topichead', 'topicset', 'topicsetref', 'anchorref',
            'ditavalref', 'navref', 'data', 'data-about',
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'title',
        ],
        description: 'Topicref can only contain nested topicrefs and metadata, not topic content',
    },
    'keydef': {
        allowedChildren: [
            'topicmeta', 'topicref', 'mapref', 'keydef', 'topicgroup',
            'topichead', 'anchorref', 'data', 'data-about',
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody',
        ],
        description: 'Keydef can only contain metadata and nested keydefs, not topic content',
    },

    // Bookmap elements
    'bookmap': {
        allowedChildren: [
            'booktitle', 'title', 'bookmeta', 'frontmatter', 'chapter',
            'part', 'appendices', 'appendix', 'backmatter', 'reltable',
            'topicref', 'mapref', 'keydef', 'ditavalref', 'glossref',
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'concept', 'task', 'reference',
        ],
        description: 'Bookmap can only contain bookmap-level children, not topic content',
    },
    'chapter': {
        allowedChildren: [
            'topicmeta', 'topicref', 'mapref', 'keydef', 'topicgroup',
            'topichead', 'anchorref', 'ditavalref',
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'title',
        ],
        description: 'Chapter can only contain topicrefs and metadata, not topic content',
    },
    'appendix': {
        allowedChildren: [
            'topicmeta', 'topicref', 'mapref', 'keydef', 'topicgroup',
            'topichead', 'anchorref', 'ditavalref',
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'title',
        ],
        description: 'Appendix can only contain topicrefs and metadata, not topic content',
    },
    'part': {
        allowedChildren: [
            'topicmeta', 'chapter', 'topicref', 'mapref', 'keydef',
            'topicgroup', 'topichead', 'anchorref', 'ditavalref',
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'title',
        ],
        description: 'Part can only contain chapters and topicrefs, not topic content',
    },
    'frontmatter': {
        allowedChildren: [
            'booklists', 'notices', 'dedication', 'colophon', 'bookabstract',
            'draftintro', 'preface', 'topicref', 'mapref', 'keydef', 'ditavalref',
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'title', 'chapter',
        ],
        description: 'Frontmatter can only contain front matter elements, not topic content',
    },
    'backmatter': {
        allowedChildren: [
            'booklists', 'notices', 'dedication', 'colophon', 'amendments',
            'topicref', 'mapref', 'keydef', 'ditavalref',
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'title', 'chapter',
        ],
        description: 'Backmatter can only contain back matter elements, not topic content',
    },

    // Topic elements
    'topic': {
        allowedChildren: [
            'title', 'titlealts', 'shortdesc', 'abstract', 'prolog',
            'body', 'related-links', 'topic',
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap'],
        description: 'Topic cannot contain map elements',
    },
    'concept': {
        allowedChildren: [
            'title', 'titlealts', 'shortdesc', 'abstract', 'prolog',
            'conbody', 'related-links', 'concept',
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'body', 'taskbody', 'refbody'],
        description: 'Concept uses conbody, not body/taskbody/refbody',
    },
    'task': {
        allowedChildren: [
            'title', 'titlealts', 'shortdesc', 'abstract', 'prolog',
            'taskbody', 'related-links', 'task',
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'body', 'conbody', 'refbody'],
        description: 'Task uses taskbody, not body/conbody/refbody',
    },
    'reference': {
        allowedChildren: [
            'title', 'titlealts', 'shortdesc', 'abstract', 'prolog',
            'refbody', 'related-links', 'reference',
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'body', 'conbody', 'taskbody'],
        description: 'Reference uses refbody, not body/conbody/taskbody',
    },
    'glossentry': {
        allowedChildren: [
            'glossterm', 'glossdef', 'glossBody', 'prolog', 'related-links',
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'body', 'conbody', 'taskbody', 'refbody'],
        description: 'Glossentry uses glossterm and glossdef',
    },
    'troubleshooting': {
        allowedChildren: [
            'title', 'titlealts', 'shortdesc', 'abstract', 'prolog',
            'troublebody', 'related-links', 'troubleshooting',
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'body', 'conbody', 'taskbody', 'refbody'],
        description: 'Troubleshooting uses troublebody',
    },

    // Body elements
    'body': {
        allowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'msgblock',
            'lines', 'lq', 'note', 'hazardstatement', 'image', 'object',
            'fig', 'table', 'simpletable', 'section', 'example',
            'div', 'sectiondiv', 'bodydiv', 'draft-comment', 'required-cleanup',
            'data', 'data-about', 'foreign', 'unknown',
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'title', 'topic', 'concept', 'task', 'reference'],
        description: 'Body contains block-level content elements',
    },
    'conbody': {
        allowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'msgblock',
            'lines', 'lq', 'note', 'hazardstatement', 'image', 'object',
            'fig', 'table', 'simpletable', 'section', 'example',
            'div', 'sectiondiv', 'bodydiv', 'draft-comment', 'required-cleanup',
            'data', 'data-about', 'foreign', 'unknown',
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'title', 'steps', 'steps-unordered'],
        description: 'Conbody contains block-level content elements (no steps)',
    },
    'taskbody': {
        allowedChildren: [
            'prereq', 'context', 'steps', 'steps-unordered', 'steps-informal',
            'result', 'tasktroubleshooting', 'example', 'postreq',
            'section', 'div', 'draft-comment', 'required-cleanup',
            'data', 'data-about', 'foreign', 'unknown',
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'title', 'p', 'ul', 'ol'],
        description: 'Taskbody contains task-specific elements (prereq, context, steps, result, postreq)',
    },
    'refbody': {
        allowedChildren: [
            'section', 'refsyn', 'example', 'table', 'simpletable',
            'properties', 'div', 'draft-comment', 'required-cleanup',
            'data', 'data-about', 'foreign', 'unknown',
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'title', 'p', 'steps'],
        description: 'Refbody contains reference-specific elements (section, refsyn, properties, table)',
    },

    // Section element
    'section': {
        allowedChildren: [
            'title', 'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'msgblock',
            'lines', 'lq', 'note', 'hazardstatement', 'image', 'object',
            'fig', 'table', 'simpletable', 'div', 'sectiondiv',
            'draft-comment', 'required-cleanup', 'data', 'data-about',
            'foreign', 'unknown',
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'topic', 'concept', 'task', 'reference', 'section', 'example'],
        description: 'Section cannot nest sections or examples',
    },

    // Metadata elements
    'topicmeta': {
        allowedChildren: [
            'navtitle', 'linktext', 'searchtitle', 'shortdesc',
            'author', 'source', 'publisher', 'copyright', 'critdates',
            'permissions', 'metadata', 'audience', 'category', 'keywords',
            'prodinfo', 'othermeta', 'resourceid', 'data', 'data-about',
            'foreign', 'unknown', 'ux-window',
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'topicref', 'title',
        ],
        description: 'Topicmeta can only contain metadata elements, not content',
    },
    'prolog': {
        allowedChildren: [
            'author', 'source', 'publisher', 'copyright', 'critdates',
            'permissions', 'metadata', 'resourceid', 'data', 'data-about',
            'foreign', 'unknown',
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'topicref', 'title',
        ],
        description: 'Prolog can only contain metadata elements, not content',
    },
};

// ---------------------------------------------------------------------------
// Simple XML element tree (for content model checking)
// ---------------------------------------------------------------------------

interface XmlElement {
    name: string;
    children: XmlElement[];
    line: number;
    column: number;
}

/**
 * Parse XML text into a lightweight element tree.
 * This is NOT a full XML parser — it only extracts element nesting for
 * content model validation. Comments, CDATA, processing instructions,
 * DOCTYPE and XML declarations are stripped (replaced with spaces to
 * preserve line/column offsets).
 */
function parseElementTree(content: string): { root: XmlElement | null; parseDiags: Diagnostic[] } {
    const parseDiags: Diagnostic[] = [];

    // Pre-process: blank out non-element constructs while preserving offsets
    const cleaned = content
        .replace(/<\?xml[^?]*\?>/g, m => ' '.repeat(m.length))
        .replace(/<!DOCTYPE\s+\w+(?:\s+(?:PUBLIC|SYSTEM)\s+["'][^"']*["'](?:\s+["'][^"']*["'])?)?(?:\s*\[[\s\S]*?\])?\s*>/gi,
            m => ' '.repeat(m.length))
        .replace(/<!--[\s\S]*?-->/g, m => ' '.repeat(m.length))
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, m => ' '.repeat(m.length))
        .replace(/<\?[\w-]+[^?]*\?>/g, m => ' '.repeat(m.length));

    // Build a line-offset table for efficient line/column lookup
    const lineOffsets: number[] = [0];
    for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '\n') lineOffsets.push(i + 1);
    }

    function offsetToPosition(offset: number): { line: number; column: number } {
        let lo = 0, hi = lineOffsets.length - 1;
        while (lo < hi) {
            const mid = (lo + hi + 1) >> 1;
            if (lineOffsets[mid] <= offset) lo = mid; else hi = mid - 1;
        }
        return { line: lo, column: offset - lineOffsets[lo] };
    }

    const stack: XmlElement[] = [];
    let root: XmlElement | null = null;

    // Matches element names including optional namespace prefix (ns:element)
    const tagPattern = /<\/?((?:[a-zA-Z_][\w.-]*:)?[a-zA-Z_][\w.-]*)((?:\s+(?:[a-zA-Z_][\w.-]*:)?[a-zA-Z_][\w.-]*\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/)?>/g;
    let match: RegExpExecArray | null;

    while ((match = tagPattern.exec(cleaned)) !== null) {
        const fullMatch = match[0];
        const tagName = match[1];
        const isClosing = fullMatch.startsWith('</');
        const isSelfClosing = match[3] === '/' || fullMatch.endsWith('/>');
        const pos = offsetToPosition(match.index);

        if (isClosing) {
            if (stack.length > 0) {
                const top = stack[stack.length - 1];
                if (top.name !== tagName) {
                    const range = Range.create(pos.line, pos.column, pos.line, pos.column + fullMatch.length);
                    parseDiags.push(Diagnostic.create(
                        range,
                        `Mismatched closing tag: expected </${top.name}>, found </${tagName}>`,
                        DiagnosticSeverity.Error,
                        'DITA-CM-PARSE',
                        'dita-lsp',
                    ));
                }
                stack.pop();
            }
        } else {
            const element: XmlElement = { name: tagName, children: [], line: pos.line, column: pos.column };

            if (stack.length > 0) {
                stack[stack.length - 1].children.push(element);
            } else {
                root = element;
            }

            if (!isSelfClosing) {
                stack.push(element);
            }
        }
    }

    return { root, parseDiags };
}

// ---------------------------------------------------------------------------
// Validation logic
// ---------------------------------------------------------------------------

function validateElement(element: XmlElement, diagnostics: Diagnostic[]): void {
    const model = DITA_CONTENT_MODELS[element.name];

    if (model) {
        // Check disallowed children (errors)
        if (model.disallowedChildren) {
            for (const child of element.children) {
                if (model.disallowedChildren.includes(child.name)) {
                    const range = Range.create(child.line, child.column, child.line, child.column + child.name.length + 2);
                    diagnostics.push(Diagnostic.create(
                        range,
                        `Invalid element <${child.name}> inside <${element.name}>. ${model.description || ''}`,
                        DiagnosticSeverity.Error,
                        'DITA-CM-001',
                        'dita-lsp',
                    ));
                }
            }
        }

        // Check required children (errors)
        if (model.requiredChildren) {
            for (const required of model.requiredChildren) {
                if (!element.children.some(c => c.name === required)) {
                    const range = Range.create(element.line, element.column, element.line, element.column + element.name.length + 2);
                    diagnostics.push(Diagnostic.create(
                        range,
                        `Missing required child element <${required}> in <${element.name}>`,
                        DiagnosticSeverity.Error,
                        'DITA-CM-002',
                        'dita-lsp',
                    ));
                }
            }
        }

        // Check required attributes (errors)
        // Note: attributes are not parsed in the server-side tree (lightweight parse).
        // Attribute validation is handled by DTD/RNG or ditaRulesValidator.

        // Check allowed children — warn for unknown elements not in disallowed list
        if (model.allowedChildren) {
            for (const child of element.children) {
                if (!model.allowedChildren.includes(child.name) &&
                    (!model.disallowedChildren || !model.disallowedChildren.includes(child.name))) {
                    const range = Range.create(child.line, child.column, child.line, child.column + child.name.length + 2);
                    diagnostics.push(Diagnostic.create(
                        range,
                        `Element <${child.name}> may not be valid inside <${element.name}>`,
                        DiagnosticSeverity.Warning,
                        'DITA-CM-003',
                        'dita-lsp',
                    ));
                }
            }
        }
    }

    // Recurse into children
    for (const child of element.children) {
        validateElement(child, diagnostics);
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate DITA content model.
 * Returns diagnostics for content model violations (wrong element nesting).
 *
 * This validator is designed to run when TypesXML/DTD validation is NOT active,
 * providing equivalent coverage via hardcoded DITA 1.3 content model rules.
 * The pipeline conditionally skips this phase when TypesXML is handling DTD validation.
 */
export function validateContentModel(text: string): Diagnostic[] {
    const { root, parseDiags } = parseElementTree(text);
    const diagnostics: Diagnostic[] = [...parseDiags];

    if (root) {
        validateElement(root, diagnostics);
    }

    return diagnostics;
}
