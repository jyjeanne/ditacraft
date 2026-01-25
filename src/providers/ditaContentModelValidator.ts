/**
 * DITA Content Model Validator
 *
 * Validates DITA documents against element content models.
 * This provides DTD-like validation without requiring native libxml2 bindings.
 *
 * Based on DITA 1.3 DTD specifications.
 */

import { ValidationError } from './ditaValidator';

/**
 * Content model definitions for DITA elements
 * Based on DITA 1.3 DTD specifications
 */
const DITA_CONTENT_MODELS: Record<string, {
    allowedChildren: string[];
    requiredChildren?: string[];
    requiredAttributes?: string[];
    disallowedChildren?: string[];
    description?: string;
}> = {
    // Map elements
    'map': {
        allowedChildren: [
            'title', 'topicmeta', 'anchor', 'data', 'data-about',
            'navref', 'reltable', 'topicref', 'mapref', 'keydef',
            'topicgroup', 'topichead', 'topicset', 'topicsetref',
            'anchorref', 'ditavalref'
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'msgblock',
            'lines', 'lq', 'note', 'hazardstatement', 'image', 'object',
            'fig', 'table', 'simpletable', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'concept', 'task', 'reference'
        ],
        description: 'Map elements can only contain map-level children (topicref, reltable, etc.), not topic content elements'
    },
    'topicref': {
        allowedChildren: [
            'topicmeta', 'topicref', 'mapref', 'keydef', 'topicgroup',
            'topichead', 'topicset', 'topicsetref', 'anchorref',
            'ditavalref', 'navref', 'data', 'data-about'
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'title'
        ],
        description: 'Topicref can only contain nested topicrefs and metadata, not topic content'
    },
    'keydef': {
        allowedChildren: [
            'topicmeta', 'topicref', 'mapref', 'keydef', 'topicgroup',
            'topichead', 'anchorref', 'data', 'data-about'
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody'
        ],
        description: 'Keydef can only contain metadata and nested keydefs, not topic content'
    },

    // Bookmap elements
    'bookmap': {
        allowedChildren: [
            'booktitle', 'title', 'bookmeta', 'frontmatter', 'chapter',
            'part', 'appendices', 'appendix', 'backmatter', 'reltable',
            'topicref', 'mapref', 'keydef', 'ditavalref'
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'concept', 'task', 'reference'
        ],
        description: 'Bookmap can only contain bookmap-level children, not topic content'
    },
    'chapter': {
        allowedChildren: [
            'topicmeta', 'topicref', 'mapref', 'keydef', 'topicgroup',
            'topichead', 'anchorref', 'ditavalref'
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'title'
        ],
        description: 'Chapter can only contain topicrefs and metadata, not topic content'
    },
    'appendix': {
        allowedChildren: [
            'topicmeta', 'topicref', 'mapref', 'keydef', 'topicgroup',
            'topichead', 'anchorref', 'ditavalref'
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'title'
        ],
        description: 'Appendix can only contain topicrefs and metadata, not topic content'
    },
    'part': {
        allowedChildren: [
            'topicmeta', 'chapter', 'topicref', 'mapref', 'keydef',
            'topicgroup', 'topichead', 'anchorref', 'ditavalref'
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'title'
        ],
        description: 'Part can only contain chapters and topicrefs, not topic content'
    },
    'frontmatter': {
        allowedChildren: [
            'booklists', 'notices', 'dedication', 'colophon', 'bookabstract',
            'draftintro', 'preface', 'topicref', 'mapref', 'keydef', 'ditavalref'
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'title', 'chapter'
        ],
        description: 'Frontmatter can only contain front matter elements, not topic content'
    },
    'backmatter': {
        allowedChildren: [
            'booklists', 'notices', 'dedication', 'colophon', 'amendments',
            'topicref', 'mapref', 'keydef', 'ditavalref'
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'title', 'chapter'
        ],
        description: 'Backmatter can only contain back matter elements, not topic content'
    },

    // Topic elements
    // Note: requiredChildren/requiredAttributes are handled by validateDitaStructure in ditaValidator.ts
    // to avoid duplicate error messages
    'topic': {
        allowedChildren: [
            'title', 'titlealts', 'shortdesc', 'abstract', 'prolog',
            'body', 'related-links', 'topic'
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap'],
        description: 'Topic cannot contain map elements'
    },
    'concept': {
        allowedChildren: [
            'title', 'titlealts', 'shortdesc', 'abstract', 'prolog',
            'conbody', 'related-links', 'concept'
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'body', 'taskbody', 'refbody'],
        description: 'Concept uses conbody, not body/taskbody/refbody'
    },
    'task': {
        allowedChildren: [
            'title', 'titlealts', 'shortdesc', 'abstract', 'prolog',
            'taskbody', 'related-links', 'task'
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'body', 'conbody', 'refbody'],
        description: 'Task uses taskbody, not body/conbody/refbody'
    },
    'reference': {
        allowedChildren: [
            'title', 'titlealts', 'shortdesc', 'abstract', 'prolog',
            'refbody', 'related-links', 'reference'
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'body', 'conbody', 'taskbody'],
        description: 'Reference uses refbody, not body/conbody/taskbody'
    },
    'glossentry': {
        allowedChildren: [
            'glossterm', 'glossdef', 'prolog', 'related-links', 'glossentry'
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'body', 'conbody', 'taskbody', 'refbody'],
        description: 'Glossentry uses glossterm and glossdef'
    },
    'troubleshooting': {
        allowedChildren: [
            'title', 'titlealts', 'shortdesc', 'abstract', 'prolog',
            'troublebody', 'related-links', 'troubleshooting'
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'body', 'conbody', 'taskbody', 'refbody'],
        description: 'Troubleshooting uses troublebody'
    },

    // Body elements
    'body': {
        allowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'msgblock',
            'lines', 'lq', 'note', 'hazardstatement', 'image', 'object',
            'fig', 'table', 'simpletable', 'section', 'example',
            'div', 'sectiondiv', 'bodydiv', 'draft-comment', 'required-cleanup',
            'data', 'data-about', 'foreign', 'unknown'
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'title', 'topic', 'concept', 'task', 'reference'],
        description: 'Body contains block-level content elements'
    },
    'conbody': {
        allowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'msgblock',
            'lines', 'lq', 'note', 'hazardstatement', 'image', 'object',
            'fig', 'table', 'simpletable', 'section', 'example',
            'div', 'sectiondiv', 'bodydiv', 'draft-comment', 'required-cleanup',
            'data', 'data-about', 'foreign', 'unknown'
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'title', 'steps', 'steps-unordered'],
        description: 'Conbody contains block-level content elements (no steps)'
    },
    'taskbody': {
        allowedChildren: [
            'prereq', 'context', 'steps', 'steps-unordered', 'steps-informal',
            'result', 'tasktroubleshooting', 'example', 'postreq',
            'section', 'div', 'draft-comment', 'required-cleanup',
            'data', 'data-about', 'foreign', 'unknown'
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'title', 'p', 'ul', 'ol'],
        description: 'Taskbody contains task-specific elements (prereq, context, steps, result, postreq)'
    },
    'refbody': {
        allowedChildren: [
            'section', 'refsyn', 'example', 'table', 'simpletable',
            'properties', 'div', 'draft-comment', 'required-cleanup',
            'data', 'data-about', 'foreign', 'unknown'
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'title', 'p', 'steps'],
        description: 'Refbody contains reference-specific elements (section, refsyn, properties, table)'
    },

    // Section/Example elements
    'section': {
        allowedChildren: [
            'title', 'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'msgblock',
            'lines', 'lq', 'note', 'hazardstatement', 'image', 'object',
            'fig', 'table', 'simpletable', 'div', 'sectiondiv',
            'draft-comment', 'required-cleanup', 'data', 'data-about',
            'foreign', 'unknown'
        ],
        disallowedChildren: ['topicref', 'map', 'chapter', 'bookmap', 'topic', 'concept', 'task', 'reference', 'section', 'example'],
        description: 'Section cannot nest sections or examples'
    },

    // Metadata elements
    'topicmeta': {
        allowedChildren: [
            'navtitle', 'linktext', 'searchtitle', 'shortdesc',
            'author', 'source', 'publisher', 'copyright', 'critdates',
            'permissions', 'metadata', 'audience', 'category', 'keywords',
            'prodinfo', 'othermeta', 'resourceid', 'data', 'data-about',
            'foreign', 'unknown', 'ux-window'
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'topicref', 'title'
        ],
        description: 'Topicmeta can only contain metadata elements, not content'
    },
    'prolog': {
        allowedChildren: [
            'author', 'source', 'publisher', 'copyright', 'critdates',
            'permissions', 'metadata', 'resourceid', 'data', 'data-about',
            'foreign', 'unknown'
        ],
        disallowedChildren: [
            'p', 'ul', 'ol', 'dl', 'pre', 'codeblock', 'section', 'example',
            'body', 'conbody', 'taskbody', 'refbody', 'topicref', 'title'
        ],
        description: 'Prolog can only contain metadata elements, not content'
    }
};

/**
 * Simple XML element representation for content model validation
 */
interface XmlElement {
    name: string;
    attributes: Record<string, string>;
    children: XmlElement[];
    line: number;
    column: number;
}

/**
 * Parse XML content into a simple element tree for validation
 */
function parseXmlForValidation(content: string): { root: XmlElement | null; parseErrors: ValidationError[] } {
    const parseErrors: ValidationError[] = [];

    // Track line numbers
    const lines = content.split('\n');

    function getPosition(index: number): { line: number; column: number } {
        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length + 1; // +1 for newline
            if (charCount + lineLength > index) {
                return { line: i, column: index - charCount };
            }
            charCount += lineLength;
        }
        return { line: lines.length - 1, column: 0 };
    }

    // Simple regex-based parser for element structure
    // This is not a full XML parser but sufficient for content model validation
    const elementStack: XmlElement[] = [];
    let root: XmlElement | null = null;

    // Pattern to match opening tags, closing tags, and self-closing tags
    const tagPattern = /<\/?([a-zA-Z_][\w.-]*)((?:\s+[a-zA-Z_][\w.-]*\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/)?>/g;

    let match: RegExpExecArray | null;
    while ((match = tagPattern.exec(content)) !== null) {
        const fullMatch = match[0];
        const tagName = match[1];
        const attributeString = match[2] || '';
        const isClosingTag = fullMatch.startsWith('</');
        const isSelfClosing = match[3] === '/' || fullMatch.endsWith('/>');
        const position = getPosition(match.index);

        // Parse attributes
        const attributes: Record<string, string> = {};
        const attrPattern = /([a-zA-Z_][\w.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
        let attrMatch: RegExpExecArray | null;
        while ((attrMatch = attrPattern.exec(attributeString)) !== null) {
            attributes[attrMatch[1]] = attrMatch[2] || attrMatch[3] || '';
        }

        if (isClosingTag) {
            // Closing tag - pop from stack
            if (elementStack.length > 0) {
                const lastElement = elementStack[elementStack.length - 1];
                if (lastElement.name !== tagName) {
                    parseErrors.push({
                        line: position.line,
                        column: position.column,
                        severity: 'error',
                        message: `Mismatched closing tag: expected </${lastElement.name}>, found </${tagName}>`,
                        source: 'content-model'
                    });
                }
                elementStack.pop();
            }
        } else {
            // Opening tag (regular or self-closing)
            const element: XmlElement = {
                name: tagName,
                attributes,
                children: [],
                line: position.line,
                column: position.column
            };

            if (elementStack.length > 0) {
                elementStack[elementStack.length - 1].children.push(element);
            } else {
                root = element;
            }

            // Only push to stack if not self-closing (needs a closing tag)
            if (!isSelfClosing) {
                elementStack.push(element);
            }
        }
    }

    return { root, parseErrors };
}

/**
 * Validate element content model
 */
function validateElement(element: XmlElement, errors: ValidationError[], warnings: ValidationError[]): void {
    const contentModel = DITA_CONTENT_MODELS[element.name];

    if (contentModel) {
        // Check for disallowed children
        if (contentModel.disallowedChildren) {
            for (const child of element.children) {
                if (contentModel.disallowedChildren.includes(child.name)) {
                    errors.push({
                        line: child.line,
                        column: child.column,
                        severity: 'error',
                        message: `Invalid element <${child.name}> inside <${element.name}>. ${contentModel.description || ''}`,
                        source: 'content-model'
                    });
                }
            }
        }

        // Check for required children
        if (contentModel.requiredChildren) {
            for (const requiredChild of contentModel.requiredChildren) {
                const hasChild = element.children.some(c => c.name === requiredChild);
                if (!hasChild) {
                    errors.push({
                        line: element.line,
                        column: element.column,
                        severity: 'error',
                        message: `Missing required child element <${requiredChild}> in <${element.name}>`,
                        source: 'content-model'
                    });
                }
            }
        }

        // Check for required attributes
        if (contentModel.requiredAttributes) {
            for (const requiredAttr of contentModel.requiredAttributes) {
                if (!element.attributes[requiredAttr]) {
                    errors.push({
                        line: element.line,
                        column: element.column,
                        severity: 'error',
                        message: `Missing required attribute "${requiredAttr}" on <${element.name}>`,
                        source: 'content-model'
                    });
                }
            }
        }

        // Check allowed children (warning if not in allowed list but not in disallowed)
        if (contentModel.allowedChildren) {
            for (const child of element.children) {
                if (!contentModel.allowedChildren.includes(child.name) &&
                    (!contentModel.disallowedChildren || !contentModel.disallowedChildren.includes(child.name))) {
                    // Only warn for unknown elements in well-defined parents
                    warnings.push({
                        line: child.line,
                        column: child.column,
                        severity: 'warning',
                        message: `Element <${child.name}> may not be valid inside <${element.name}>`,
                        source: 'content-model'
                    });
                }
            }
        }
    }

    // Recursively validate children
    for (const child of element.children) {
        validateElement(child, errors, warnings);
    }
}

/**
 * Validate DITA content model
 */
export function validateDitaContentModel(content: string): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Create a version for parsing that replaces (not removes) prolog elements
    // to preserve line numbers. Replace with spaces to maintain positions.
    const xmlForParsing = content
        // Replace XML declaration with spaces
        .replace(/<\?xml[^?]*\?>/g, match => ' '.repeat(match.length))
        // Replace DOCTYPE (including internal subsets) with spaces
        .replace(/<!DOCTYPE\s+\w+(?:\s+(?:PUBLIC|SYSTEM)\s+["'][^"']*["'](?:\s+["'][^"']*["'])?)?(?:\s*\[[\s\S]*?\])?\s*>/gi,
            match => ' '.repeat(match.length))
        // Replace comments with spaces
        .replace(/<!--[\s\S]*?-->/g, match => ' '.repeat(match.length))
        // Replace CDATA sections with spaces (preserve structure)
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, match => ' '.repeat(match.length))
        // Replace processing instructions with spaces
        .replace(/<\?[\w-]+[^?]*\?>/g, match => ' '.repeat(match.length));

    const { root, parseErrors } = parseXmlForValidation(xmlForParsing);

    // Add parse errors
    errors.push(...parseErrors);

    // Validate content model if we have a root element
    if (root) {
        validateElement(root, errors, warnings);
    }

    return { errors, warnings };
}

/**
 * Check if an element is a map element
 */
export function isMapElement(elementName: string): boolean {
    return ['map', 'bookmap'].includes(elementName);
}

/**
 * Check if an element is a topic element
 */
export function isTopicElement(elementName: string): boolean {
    return ['topic', 'concept', 'task', 'reference', 'glossentry', 'troubleshooting'].includes(elementName);
}

/**
 * Get content model for an element
 */
export function getContentModel(elementName: string): typeof DITA_CONTENT_MODELS[string] | undefined {
    return DITA_CONTENT_MODELS[elementName];
}
