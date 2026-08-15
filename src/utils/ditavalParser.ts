/**
 * DITAVAL Rule Parsing (§4.5 Piece 2: condition highlighting)
 *
 * Lightweight regex-based parsing of `.ditaval` filter rules and matching
 * against an element's profiling attributes. Regex-based, matching this
 * codebase's established client-side XML handling convention (see
 * insertImageCommand.ts / fileCreationCommands.ts) rather than a full
 * parser — a `.ditaval` file's own well-formedness is already validated
 * elsewhere (contentModelValidation.ts); this module only needs to *read*
 * its `<prop>` rules, not validate them.
 *
 * Deliberately scoped to exact attribute/value matching only — it does not
 * resolve a subject scheme's controlled-value hierarchy (e.g. knowing that
 * `audience="internal"` is a child of `audience="restricted"` in a
 * `<subjectdef>` tree). That resolution already exists server-side
 * (`SubjectSchemeService`), and wiring a client-side decoration pass
 * through it is real future work, not something to fold into this pass —
 * see `docs/V0.9-IMPLEMENTATION-PLAN.md` §4.5 for the tracked scope note.
 */

/** A single `<prop>` rule parsed out of a `.ditaval` file. */
export interface DitavalRule {
    action: string;
    att?: string;
    val?: string;
}

/**
 * Profiling attributes DITAVAL `<prop>` rules can target. Mirrors the
 * standard DITA profiling attribute set; `otherprops`/`props` are the two
 * legacy/generic ones, the rest are the well-known specific attributes.
 */
export const PROFILING_ATTRIBUTES = ['audience', 'platform', 'product', 'otherprops', 'props', 'rev'] as const;

const PROP_TAG_PATTERN = /<prop\b((?:[^>"']|"[^"]*"|'[^']*')*)\/?>/gi;
const ATTR_PATTERN = /([\w-]+)\s*=\s*"([^"]*)"|([\w-]+)\s*=\s*'([^']*)'/g;

/** Parse every attribute name/value pair out of a tag's raw attribute text. */
function parseAttributes(attrsText: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    ATTR_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = ATTR_PATTERN.exec(attrsText)) !== null) {
        const name = (match[1] ?? match[3]).toLowerCase();
        const value = match[2] ?? match[4];
        attrs[name] = value;
    }
    return attrs;
}

/**
 * Parse every `<prop action="..." att="..." val="...">` rule out of a
 * `.ditaval` file's content. Rules missing `action` are skipped — they
 * can't drive an exclude/include decision.
 */
export function parseDitavalRules(content: string): DitavalRule[] {
    const rules: DitavalRule[] = [];
    PROP_TAG_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = PROP_TAG_PATTERN.exec(content)) !== null) {
        const attrs = parseAttributes(match[1]);
        if (!attrs.action) {
            continue;
        }
        rules.push({
            action: attrs.action.toLowerCase(),
            att: attrs.att?.toLowerCase(),
            val: attrs.val
        });
    }
    return rules;
}

/**
 * True if an element's own attribute map is excluded by any
 * `action="exclude"` rule. Only `exclude` actions are decoration-worthy —
 * `include`/`flag`/`passthrough` don't remove content from a filtered
 * publish, so highlighting them as "excluded" would be actively wrong, not
 * just unhelpful. A rule with `att` but no `val` matches the attribute
 * regardless of value; DITA profiling attributes are space-separated value
 * lists (e.g. `audience="internal external"`), so each token is checked
 * individually against a rule's `val`. A rule with no `att` at all is a
 * scheme-wide default action, not an attribute-specific one — out of scope
 * for per-element highlighting, so it's ignored here rather than matched
 * against every element.
 *
 * `/code-review` correctness fix: a `val`-specific rule for a given
 * attribute+value now takes precedence over a `val`-less default rule for
 * the same attribute, regardless of which appears first in the `.ditaval`
 * file — matching the standard "exclude by default, selectively include"
 * DITAVAL authoring pattern (`<prop action="exclude" att="platform"/>`
 * followed by `<prop action="include" att="platform" val="windows"/>`).
 * Without this, a val-less exclude default matched before its more
 * specific include exception was ever consulted, dimming content DITA-OT
 * would actually publish.
 */
/**
 * Regenerate a complete `.ditaval` document from a flat list of rules —
 * used by the Visual DITAVAL Condition Editor (§5.3) to write back a
 * toggled condition set.
 *
 * This REPLACES the file's entire `<val>` content. Anything the editor
 * doesn't model as a `DitavalRule` — comments, `<style-conflict>` blocks,
 * or any element other than `<prop>` — is not preserved; a value-less
 * "default for this attribute" rule (`att` set, `val` omitted) IS
 * preserved as long as it's included in `rules`, since the editor keeps
 * those alongside the value-specific rules it edits rather than dropping
 * them (see `ditavalConditionEditorPanel.ts`). This is a documented,
 * deliberate v1 scope limit — the editor surfaces a warning about it
 * before the first edit rather than silently discarding content.
 */
export function buildDitavalDocument(rules: readonly DitavalRule[]): string {
    const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<val>'];
    for (const rule of rules) {
        const parts = [`action="${escapeDitavalAttr(rule.action)}"`];
        if (rule.att) {
            parts.push(`att="${escapeDitavalAttr(rule.att)}"`);
        }
        if (rule.val !== undefined) {
            parts.push(`val="${escapeDitavalAttr(rule.val)}"`);
        }
        lines.push(`    <prop ${parts.join(' ')}/>`);
    }
    lines.push('</val>');
    return lines.join('\n') + '\n';
}

function escapeDitavalAttr(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

export function isExcludedByRules(attrs: Record<string, string | undefined>, rules: readonly DitavalRule[]): boolean {
    for (const [attName, rawValue] of Object.entries(attrs)) {
        if (rawValue === undefined) {
            continue;
        }
        const attRules = rules.filter(r => r.att === attName);
        if (attRules.length === 0) {
            continue;
        }

        const tokens = rawValue.split(/\s+/).filter(t => t.length > 0);
        for (const token of tokens) {
            const specificRule = attRules.find(r => r.val === token);
            if (specificRule) {
                if (specificRule.action === 'exclude') {
                    return true;
                }
                continue; // A specific include/flag/passthrough rule matched — this token is not excluded.
            }
            const defaultRule = attRules.find(r => r.val === undefined);
            if (defaultRule?.action === 'exclude') {
                return true;
            }
        }
    }
    return false;
}
