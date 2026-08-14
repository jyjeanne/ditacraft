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
 */
export function isExcludedByRules(attrs: Record<string, string | undefined>, rules: readonly DitavalRule[]): boolean {
    for (const rule of rules) {
        if (rule.action !== 'exclude' || !rule.att) {
            continue;
        }
        const value = attrs[rule.att];
        if (value === undefined) {
            continue;
        }
        if (rule.val === undefined) {
            return true;
        }
        const tokens = value.split(/\s+/).filter(t => t.length > 0);
        if (tokens.includes(rule.val)) {
            return true;
        }
    }
    return false;
}
